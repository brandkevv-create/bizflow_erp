-- Table for tracking Returns / RMAs
CREATE TYPE return_status AS ENUM ('pending', 'approved', 'rejected', 'refunded');

CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT NOT NULL UNIQUE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    status return_status NOT NULL DEFAULT 'pending',
    reason TEXT NOT NULL,
    refund_amount NUMERIC(15, 2) DEFAULT 0 CHECK (refund_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking items within a Return
CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    quantity NUMERIC(15, 2) NOT NULL CHECK (quantity > 0),
    restock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to returns" ON returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to return_items" ON return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to handle restocking inventory when a return is marked as 'refunded'
CREATE OR REPLACE FUNCTION process_return_restock()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_product RECORD;
    v_component RECORD;
    v_location_id UUID;
    v_is_kit BOOLEAN;
BEGIN
    -- Only restock if status changed TO 'refunded'
    IF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
        
        -- Get the location where the order originated, or fallback to default
        SELECT COALESCE(
            (SELECT location_id FROM orders WHERE id = NEW.order_id),
            (SELECT id FROM locations WHERE is_active = true ORDER BY created_at ASC LIMIT 1)
        ) INTO v_location_id;

        IF v_location_id IS NULL THEN
            RAISE EXCEPTION 'No active location found for restocking.';
        END IF;

        -- Iterate over all return items marked for restocking
        FOR v_item IN (SELECT a.quantity, b.product_id FROM return_items a JOIN order_items b ON a.order_item_id = b.id WHERE a.return_id = NEW.id AND a.restock = true) LOOP
            
            -- Check if product is a kit
            SELECT is_kit INTO v_is_kit FROM products WHERE id = v_item.product_id;

            IF v_is_kit THEN
                -- Add stock back to components
                FOR v_component IN (SELECT component_id, quantity FROM product_components WHERE kit_id = v_item.product_id) LOOP
                    UPDATE inventory_levels 
                    SET stock_quantity = stock_quantity + (v_component.quantity * v_item.quantity)
                    WHERE product_id = v_component.component_id AND location_id = v_location_id;
                END LOOP;
            ELSE
                -- Add stock back to regular product
                UPDATE inventory_levels 
                SET stock_quantity = stock_quantity + v_item.quantity
                WHERE product_id = v_item.product_id AND location_id = v_location_id;
            END IF;
             
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the restock function
DROP TRIGGER IF EXISTS trigger_process_return_restock ON returns;
CREATE TRIGGER trigger_process_return_restock
AFTER UPDATE ON returns
FOR EACH ROW
EXECUTE FUNCTION process_return_restock();
