-- Create Stock Transfer Status Enum
CREATE TYPE transfer_status AS ENUM ('pending', 'in_transit', 'completed', 'cancelled');

-- Create Reason Enum for Adjustments
CREATE TYPE adjustment_reason AS ENUM ('shrinkage', 'damage', 'found', 'initial_count', 'return');

-- Create Adjustment Status Enum
CREATE TYPE adjustment_status AS ENUM ('draft', 'posted');

-- 1. TABLE: stock_transfers
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    source_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
    destination_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
    status transfer_status DEFAULT 'pending'::transfer_status NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    shipped_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT different_locations CHECK (source_location_id != destination_location_id)
);

-- 2. TABLE: stock_transfer_items
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    UNIQUE(transfer_id, product_id)
);

-- 3. TABLE: stock_adjustments (Audits/Takes)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT NOT NULL UNIQUE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
    reason adjustment_reason NOT NULL,
    status adjustment_status DEFAULT 'draft'::adjustment_status NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE
);

-- 4. TABLE: stock_adjustment_items
CREATE TABLE IF NOT EXISTS public.stock_adjustment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id UUID NOT NULL REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    expected_quantity NUMERIC NOT NULL,
    actual_quantity NUMERIC NOT NULL,
    UNIQUE(adjustment_id, product_id)
);

-- Enable RLS
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustment_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access to these tables (Can restrict via app roles later)
CREATE POLICY "Full access to stock_transfers" ON public.stock_transfers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to stock_transfer_items" ON public.stock_transfer_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to stock_adjustments" ON public.stock_adjustments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to stock_adjustment_items" ON public.stock_adjustment_items FOR ALL USING (auth.role() = 'authenticated');

-- FUNCTIONS AND TRIGGERS FOR TRANSFERS --

-- Function: Process Transfer Status Change
CREATE OR REPLACE FUNCTION public.process_stock_transfer()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Transition: pending -> in_transit (Shipped)
    IF OLD.status = 'pending' AND NEW.status = 'in_transit' THEN
        -- Deduct from source location
        FOR item IN SELECT * FROM stock_transfer_items WHERE transfer_id = NEW.id LOOP
            UPDATE inventory_levels
            SET stock_quantity = stock_quantity - item.quantity,
                updated_at = now()
            WHERE product_id = item.product_id AND location_id = NEW.source_location_id;
            
            -- If inventory_levels doesn't exist for source, it's an error in business logic, but handled by app.
        END LOOP;
        NEW.shipped_at = now();
    END IF;

    -- Transition: in_transit -> completed (Received)
    IF OLD.status = 'in_transit' AND NEW.status = 'completed' THEN
        -- Add to destination location
        FOR item IN SELECT * FROM stock_transfer_items WHERE transfer_id = NEW.id LOOP
            -- Upsert inventory level at destination
            INSERT INTO inventory_levels (product_id, location_id, stock_quantity, reorder_point)
            VALUES (item.product_id, NEW.destination_location_id, item.quantity, 10)
            ON CONFLICT (product_id, location_id) 
            DO UPDATE SET 
                stock_quantity = inventory_levels.stock_quantity + EXCLUDED.stock_quantity,
                updated_at = now();
        END LOOP;
        NEW.received_at = now();
    END IF;

    -- Transition: to cancelled
    IF OLD.status = 'in_transit' AND NEW.status = 'cancelled' THEN
        -- Revert source location deduction
        FOR item IN SELECT * FROM stock_transfer_items WHERE transfer_id = NEW.id LOOP
            UPDATE inventory_levels
            SET stock_quantity = stock_quantity + item.quantity,
                updated_at = now()
            WHERE product_id = item.product_id AND location_id = NEW.source_location_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_process_stock_transfer
    BEFORE UPDATE ON public.stock_transfers
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE PROCEDURE public.process_stock_transfer();


-- FUNCTIONS AND TRIGGERS FOR ADJUSTMENTS --

-- Function: Post Stock Adjustment
CREATE OR REPLACE FUNCTION public.post_stock_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF OLD.status = 'draft' AND NEW.status = 'posted' THEN
        FOR item IN SELECT * FROM stock_adjustment_items WHERE adjustment_id = NEW.id LOOP
            -- Upsert inventory level with actual_quantity
            INSERT INTO inventory_levels (product_id, location_id, stock_quantity, reorder_point)
            VALUES (item.product_id, NEW.location_id, item.actual_quantity, 10)
            ON CONFLICT (product_id, location_id) 
            DO UPDATE SET 
                stock_quantity = EXCLUDED.stock_quantity,
                updated_at = now();
        END LOOP;
        NEW.posted_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_post_stock_adjustment
    BEFORE UPDATE ON public.stock_adjustments
    FOR EACH ROW
    WHEN (OLD.status = 'draft' AND NEW.status = 'posted')
    EXECUTE PROCEDURE public.post_stock_adjustment();
