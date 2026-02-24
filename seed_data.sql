
DO $$
DECLARE
    customer_id_1 UUID;
    customer_id_2 UUID;
    product_id_1 UUID;
    product_id_2 UUID;
    order_id UUID;
    invoice_id UUID;
    i INT;
    random_amount NUMERIC;
BEGIN
    -- Get or Create Customers
    SELECT id INTO customer_id_1 FROM customers LIMIT 1;
    IF customer_id_1 IS NULL THEN
        INSERT INTO customers (full_name, email) VALUES ('John Doe', 'john.doe@example.com') RETURNING id INTO customer_id_1;
    END IF;
    
    SELECT id INTO customer_id_2 FROM customers WHERE id != customer_id_1 LIMIT 1;
    IF customer_id_2 IS NULL THEN
        INSERT INTO customers (full_name, email) VALUES ('Jane Smith', 'jane.smith@example.com') RETURNING id INTO customer_id_2;
    END IF;

    -- Get Products
    SELECT id INTO product_id_1 FROM products LIMIT 1;
    SELECT id INTO product_id_2 FROM products OFFSET 1 LIMIT 1;
    
    -- If no products, create dummy ones
    IF product_id_1 IS NULL THEN
         INSERT INTO products (name, stock_quantity, price) VALUES ('Product A', 100, 50.00) RETURNING id INTO product_id_1;
    END IF;

    -- Generate Data
    FOR i IN 1..15 LOOP
        random_amount := (random() * 500 + 50)::NUMERIC(10,2);
        
        -- Create Order
        INSERT INTO orders (customer_id, status, total_amount, created_at)
        VALUES (
            CASE WHEN i % 2 = 0 THEN customer_id_1 ELSE customer_id_2 END,
            CASE WHEN i % 3 = 0 THEN 'Pending' ELSE 'Completed' END, 
            random_amount,
            NOW() - (i || ' days')::INTERVAL
        ) RETURNING id INTO order_id;

        -- Create Order Items
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (order_id, product_id_1, 1 + (i % 3), 50.00);

        -- Create Invoice (for most orders)
        IF i % 3 != 0 THEN
             INSERT INTO invoices (invoice_number, customer_id, order_id, issue_date, due_date, status, total_amount, paid_amount, created_at)
             VALUES (
                 'INV-' || i,
                 CASE WHEN i % 2 = 0 THEN customer_id_1 ELSE customer_id_2 END,
                 order_id,
                 (NOW() - (i || ' days')::INTERVAL)::DATE,
                 (NOW() + (30 - i || ' days')::INTERVAL)::DATE,
                 CASE WHEN i % 5 = 0 THEN 'Overdue' ELSE 'Paid' END,
                 random_amount,
                 CASE WHEN i % 5 = 0 THEN 0 ELSE random_amount END,
                 NOW() - (i || ' days')::INTERVAL
             ) RETURNING id INTO invoice_id;

             -- Invoice Items
             INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
             VALUES (invoice_id, 'Items from Order #' || i, 1, random_amount, random_amount);

             -- Payment (for Paid invoices)
             IF i % 5 != 0 THEN
                 INSERT INTO payments (invoice_id, customer_id, amount, payment_method, status, date, reference, notes)
                 VALUES (
                     invoice_id,
                     CASE WHEN i % 2 = 0 THEN customer_id_1 ELSE customer_id_2 END,
                     random_amount,
                     CASE WHEN i % 2 = 0 THEN 'Credit Card' ELSE 'Bank Transfer' END,
                     'Completed',
                     (NOW() - (i || ' days')::INTERVAL)::DATE,
                     'PAY-' || i,
                     'Auto-generated payment'
                 );
             END IF;
        END IF;
    END LOOP;
END $$;
