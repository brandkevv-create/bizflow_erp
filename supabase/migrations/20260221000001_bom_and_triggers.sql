-- Modifications to allow products to be kits
ALTER TABLE products ADD COLUMN is_kit BOOLEAN DEFAULT false;

-- Table to store components of a kit
CREATE TABLE product_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID REFERENCES products(id) ON DELETE CASCADE,
    component_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(15, 2) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(kit_id, component_id)
);

-- RLS for product_components
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to product_components"
ON product_components FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to handle inventory deduction on order item insertion
CREATE OR REPLACE FUNCTION process_order_item_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_is_kit BOOLEAN;
    v_location_id UUID;
    v_component RECORD;
BEGIN
    -- Only process for 'Online' or 'Physical Store' orders that are not 'Cancelled' or 'Draft' (assuming they hit order_items, they are real orders)
    -- Actually, in our current setup, if an order is created, we deduct stock. 
    -- If it's cancelled later, we'll need a separate trigger on `orders` to restock, but for now we focus on deduction.
    
    -- Check if the product is a kit
    SELECT is_kit INTO v_is_kit FROM products WHERE id = NEW.product_id;

    -- Find the active location to deduct from. 
    -- For robustness, ideally orders should have a location_id.
    -- If order.location_id is null, use the default active location.
    SELECT COALESCE(
        (SELECT location_id FROM orders WHERE id = NEW.order_id),
        (SELECT id FROM locations WHERE is_active = true ORDER BY created_at ASC LIMIT 1)
    ) INTO v_location_id;

    IF v_location_id IS NULL THEN
        RAISE EXCEPTION 'No active location found for inventory deduction.';
    END IF;

    IF v_is_kit THEN
        -- It's a kit, deduct inventory for all its components
        FOR v_component IN (SELECT component_id, quantity FROM product_components WHERE kit_id = NEW.product_id) LOOP
            -- Upsert inventory level for the component
            INSERT INTO inventory_levels (product_id, location_id, stock_quantity)
            VALUES (v_component.component_id, v_location_id, -1 * (v_component.quantity * NEW.quantity))
            ON CONFLICT (product_id, location_id)
            DO UPDATE SET stock_quantity = inventory_levels.stock_quantity - (v_component.quantity * NEW.quantity);
        END LOOP;
    ELSE
        -- Standard product, deduct its own inventory
        INSERT INTO inventory_levels (product_id, location_id, stock_quantity)
        VALUES (NEW.product_id, v_location_id, -NEW.quantity)
        ON CONFLICT (product_id, location_id)
        DO UPDATE SET stock_quantity = inventory_levels.stock_quantity - NEW.quantity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function after inserting an order item
DROP TRIGGER IF EXISTS trigger_process_order_item_inventory ON order_items;
CREATE TRIGGER trigger_process_order_item_inventory
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION process_order_item_inventory();
