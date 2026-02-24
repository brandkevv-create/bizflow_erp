const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.error('Error reading .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateOrder() {
    const email = 'demo@bizflow.com';
    const password = 'demo123';

    console.log(`Logging in as ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        return;
    }
    console.log('Logged in successfully.');

    // 1. Get a product
    const { data: products, error: productError } = await supabase.from('products').select('*').limit(1);
    if (productError || !products || products.length === 0) {
        console.error('Failed to fetch product:', productError ? productError.message : 'No products found');
        return;
    }
    const product = products[0];
    console.log(`Found product: ${product.name} (${product.id})`);

    // 1.5 Get a customer
    const { data: customers, error: customerError } = await supabase.from('customers').select('*').limit(1);
    let customerId = null;
    if (!customerError && customers && customers.length > 0) {
        customerId = customers[0].id;
        console.log(`Found customer: ${customers[0].full_name} (${customerId})`);
    } else {
        console.error('Failed to fetch customer:', customerError?.message || 'No customers found');
    }

    // 2. Create Order
    const total = 110.00;

    console.log('Creating order...');
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_id: customerId,
            status: 'Completed',
            total_amount: total,
        })
        .select()
        .single();

    if (orderError) {
        console.error('FAILED to create order:', orderError);
        return;
    }
    console.log('Order created:', orderData.id);

    // 3. Create Order Items
    console.log('Creating order items...');
    const { error: itemsError } = await supabase
        .from('order_items')
        .insert([{
            order_id: orderData.id,
            product_id: product.id,
            quantity: 1,
            unit_price: product.price
        }]);

    if (itemsError) {
        console.error('FAILED to create order items:', itemsError);
        return;
    }
    console.log('Order items created.');

    // 4. Create Payment
    console.log('Creating payment...');
    const { error: paymentError } = await supabase
        .from('payments')
        .insert({
            order_id: orderData.id,
            amount: total,
            status: 'Completed',
            payment_method: 'Cash'
        });

    if (paymentError) {
        console.error('FAILED to create payment:', paymentError);
        return;
    }
    console.log('Payment created successfully!');

    // 5. Verify order linkage
    const { data: verifyOrder, error: verifyError } = await supabase
        .from('orders')
        .select(`*, customers(full_name, email)`)
        .eq('id', orderData.id)
        .single();

    if (verifyError || !verifyOrder) {
        console.error('Failed to verify order:', verifyError);
        return;
    }
    console.log('--- Verification ---');
    console.log('Order ID:', verifyOrder.id);
    console.log('Customer ID linked:', verifyOrder.customer_id);
    console.log('Customer Details:', verifyOrder.customers);

    if (verifyOrder.customer_id === customerId) {
        console.log('SUCCESS: Order is correctly linked to the customer in the database!');
    } else {
        console.log('FAILURE: Order customer_id mismatch.');
    }
}

testCreateOrder();
