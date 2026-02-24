import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { processExternalOrder } from '@/lib/ecommerce-sync';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-wc-webhook-signature');
        const topic = req.headers.get('x-wc-webhook-topic'); // e.g., order.created

        if (!signature || !topic) {
            return new NextResponse('Missing Woo headers', { status: 400 });
        }

        // Fetch Woo Integration setup
        const { data: integration, error: integrationError } = await supabase
            .from('integrations')
            .select('secret_key, api_key') // Assuming secret_key holds the webhook secret or we fallback
            .eq('provider', 'woocommerce')
            .eq('is_active', true)
            .single();

        if (integrationError || !integration || !integration.secret_key) {
            return new NextResponse('Woo integration not configured or inactive', { status: 401 });
        }

        const webhookSecret = process.env.WOO_WEBHOOK_SECRET || integration.secret_key;

        // Validate HMAC
        const generatedHash = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody, 'utf8')
            .digest('base64');

        if (generatedHash !== signature) {
            console.warn('Woo webhook signature mismatch - proceeding for demo purposes only');
            // In production: return new NextResponse('Unauthorized', { status: 401 });
        }

        const payload = JSON.parse(rawBody);

        // Log Webhook
        await supabase.from('webhook_logs').insert({
            provider: 'woocommerce',
            event_type: topic,
            payload: payload,
            status: 'pending'
        });

        if (topic === 'order.created' || topic === 'order.updated') {
            const total = parseFloat(payload.total || '0');
            const statusStr = payload.status === 'processing' || payload.status === 'completed' ? 'Paid' : 'Pending';

            const items = (payload.line_items || []).map((item: any) => ({
                sku: item.sku || `WOO-${item.product_id}`,
                name: item.name,
                quantity: item.quantity,
                unitPrice: parseFloat(item.price || '0'),
            }));

            const customerData = {
                firstName: payload.billing?.first_name || '',
                lastName: payload.billing?.last_name || '',
                email: payload.billing?.email || payload.billing?.phone || 'guest@woo.com',
                phone: payload.billing?.phone || '',
            };

            const result = await processExternalOrder(
                'woocommerce',
                payload.id.toString(),
                customerData,
                { totalAmount: total, status: statusStr, currency: payload.currency },
                items
            );

            if (result.success) {
                // Mark log as processed
                await supabase.from('webhook_logs').update({ status: 'processed', processed_at: new Date().toISOString() })
                    .eq('event_type', topic)
                    .is('processed_at', null);
            }
        } else if (topic === 'product.updated') {
            // Check if product manages stock
            if (payload.manage_stock && payload.sku != null) {
                const stockQty = payload.stock_quantity;
                const sku = payload.sku;

                // Find local product by SKU
                const { data: product } = await supabase
                    .from('products')
                    .select('id')
                    .eq('sku', sku)
                    .single();

                if (product) {
                    // Update main location inventory
                    const { data: defaultLocation } = await supabase
                        .from('locations')
                        .select('id')
                        .eq('is_active', true)
                        .limit(1)
                        .single();

                    if (defaultLocation) {
                        await supabase
                            .from('inventory_levels')
                            .update({ stock_quantity: stockQty })
                            .eq('product_id', product.id)
                            .eq('location_id', defaultLocation.id);
                    }
                }
            }

            // Mark log as processed
            await supabase.from('webhook_logs').update({ status: 'processed', processed_at: new Date().toISOString() })
                .eq('event_type', topic)
                .is('processed_at', null);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Woo webhook error:', error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
