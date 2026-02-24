import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const { action } = await req.json();

        // Validate action
        if (!action || !['pull_inventory', 'pull_orders'].includes(action)) {
            return NextResponse.json({ error: 'Invalid sync action. Supported actions: pull_inventory, pull_orders' }, { status: 400 });
        }

        // Fetch WooCommerce integration config
        const { data: integration, error: integrationError } = await supabase
            .from('integrations')
            .select('*')
            .eq('provider', 'woocommerce')
            .eq('is_active', true)
            .single();

        if (integrationError || !integration || !integration.api_key || !integration.secret_key || !integration.shop_url) {
            return NextResponse.json({ error: 'WooCommerce integration is not configured or inactive.' }, { status: 400 });
        }

        const shopUrl = integration.shop_url.replace(/\/$/, ""); // Remove trailing slash if present
        const consumerKey = integration.api_key;
        const consumerSecret = integration.secret_key;

        // Create Basic Auth Header
        const authHeader = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;

        if (action === 'pull_inventory') {
            // Pull products from WooCommerce to Local DB
            const res = await fetch(`${shopUrl}/wp-json/wc/v3/products?per_page=50`, {
                method: 'GET',
                headers: { 'Authorization': authHeader }
            });
            const wooProducts = await res.json();

            if (!res.ok) {
                console.error("Woo API Error:", wooProducts);
                return NextResponse.json({ error: 'Failed to fetch from WooCommerce' }, { status: res.status });
            }

            let pulled = 0;
            for (const wp of wooProducts) {
                // Upsert to Supabase
                const { data: newProd, error } = await supabase.from('products').upsert({
                    name: wp.name,
                    price: parseFloat(wp.price || '0'),
                    cost_price: 0,
                    sku: wp.sku || `WOO-${wp.id}`,
                }, { onConflict: 'name' }).select().single();

                if (!error && newProd) {
                    // Update inventory for default location
                    const { data: locData } = await supabase.from('locations').select('id').eq('is_active', true).limit(1).single();
                    if (locData) {
                        await supabase.from('inventory_levels').upsert({
                            product_id: newProd.id,
                            location_id: locData.id,
                            stock_quantity: wp.stock_quantity || 0,
                            reorder_point: 10
                        }, { onConflict: 'product_id, location_id' });
                    }
                    pulled++;
                }
            }
            return NextResponse.json({ message: `Pulled ${pulled} products from WooCommerce.` });

        } else if (action === 'pull_orders') {
            // Pull recent open orders from WooCommerce
            const res = await fetch(`${shopUrl}/wp-json/wc/v3/orders?status=processing,pending&per_page=10`, {
                method: 'GET',
                headers: { 'Authorization': authHeader }
            });
            const wooOrders = await res.json();

            if (!res.ok) {
                console.error("Woo API Error:", wooOrders);
                return NextResponse.json({ error: 'Failed to fetch from WooCommerce' }, { status: res.status });
            }

            let pulled = 0;
            for (const wo of wooOrders) {
                const total = parseFloat(wo.total || '0');
                const statusStr = wo.status === 'processing' ? 'Paid' : 'Pending';

                // Insert into orders
                const { error } = await supabase.from('orders').insert({
                    total_amount: total,
                    status: statusStr,
                });

                if (!error) pulled++;
            }

            return NextResponse.json({ message: `Pulled ${pulled} latest orders from WooCommerce.` });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('WooCommerce Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
