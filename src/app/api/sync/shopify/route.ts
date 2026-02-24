import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const { action } = await req.json();

        // Validate action
        if (!action || !['push_inventory', 'pull_inventory', 'pull_orders'].includes(action)) {
            return NextResponse.json({ error: 'Invalid sync action. Supported actions: push_inventory, pull_inventory, pull_orders' }, { status: 400 });
        }

        // Fetch Shopify integration config
        const { data: integration, error: integrationError } = await supabase
            .from('integrations')
            .select('*')
            .eq('provider', 'shopify')
            .eq('is_active', true)
            .single();

        if (integrationError || !integration || !integration.api_key || !integration.shop_url) {
            return NextResponse.json({ error: 'Shopify integration is not configured or inactive.' }, { status: 400 });
        }

        const shopUrl = integration.shop_url;
        const accessToken = integration.api_key; // Assuming Admin API access token is stored here

        if (action === 'push_inventory') {
            // Push local products to Shopify
            const { data: products } = await supabase.from('products').select('*').limit(50); // limit for demo safety
            if (!products) return NextResponse.json({ message: 'No products to push.' });

            let pushed = 0;
            for (const product of products) {
                try {
                    const payload = {
                        product: {
                            title: product.name,
                            vendor: "BizFlow ERP",
                            product_type: "Standard",
                            variants: [
                                {
                                    price: product.price.toString(),
                                    sku: product.sku || `SKU-${product.id.substring(0, 8)}`,
                                    inventory_quantity: product.stock_level,
                                    inventory_management: "shopify"
                                }
                            ]
                        }
                    };

                    const res = await fetch(`https://${shopUrl}/admin/api/2024-01/products.json`, {
                        method: 'POST',
                        headers: {
                            'X-Shopify-Access-Token': accessToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) pushed++;
                } catch (err) {
                    console.error('Failed pushing product:', err);
                }
            }
            return NextResponse.json({ message: `Successfully synced ${pushed} products to Shopify.` });

        } else if (action === 'pull_inventory') {
            // Pull products from Shopify to Local DB
            const res = await fetch(`https://${shopUrl}/admin/api/2024-01/products.json`, {
                method: 'GET',
                headers: { 'X-Shopify-Access-Token': accessToken }
            });
            const data = await res.json();
            const shopifyProducts = data.products || [];

            let pulled = 0;
            for (const sp of shopifyProducts) {
                const variant = sp.variants[0]; // grab first variant for simplicity
                if (!variant) continue;

                const { error } = await supabase.from('products').upsert({
                    // Avoid explicit ID to let Supabase generate UUID, but use SKU or Name to maybe prevent dups in future.
                    // For now, insert as new if name doesn't exist (simplistic matching)
                    name: sp.title,
                    price: parseFloat(variant.price || '0'),
                    cost_price: 0, // Shopify doesn't expose cost price easily without inventory item API
                    stock_level: variant.inventory_quantity || 0,
                    sku: variant.sku || `SHP-${sp.id}`,
                    // Assuming a default category exists or null
                }, { onConflict: 'name' }); // Assuming 'name' has a unique constraint or we just accept dups for now. Note: BizFlow schema doesn't have unique on Name by default. 

                // If no unique constraint exists, it will insert. A robust integration maps provider_id to internal_id.
                pulled++;
            }
            return NextResponse.json({ message: `Pulled ${pulled} products from Shopify.` });

        } else if (action === 'pull_orders') {
            // Pull recent open orders from Shopify
            const res = await fetch(`https://${shopUrl}/admin/api/2024-01/orders.json?status=any&limit=10`, {
                headers: { 'X-Shopify-Access-Token': accessToken }
            });
            const data = await res.json();
            const shopifyOrders = data.orders || [];

            let pulled = 0;
            for (const so of shopifyOrders) {
                const total = parseFloat(so.current_total_price || '0');
                const statusStr = so.financial_status === 'paid' ? 'Paid' : 'Pending';

                // Insert into orders
                const { error } = await supabase.from('orders').insert({
                    total_amount: total,
                    status: statusStr,
                    // customer_id: we'd need to upsert customer first. Assuming null for demo
                });

                if (!error) pulled++;
            }

            return NextResponse.json({ message: `Pulled ${pulled} latest orders from Shopify.` });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Shopify Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
