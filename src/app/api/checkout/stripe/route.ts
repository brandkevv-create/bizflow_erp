import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Fallback to anon key for simplicity in dev, though typical setups use the service role key for API routes
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, invoice_id } = body;

        let referenceId = order_id || invoice_id;
        let amount = 0;
        let currency = 'usd';
        let description = '';
        let businessId = '';

        if (!referenceId) {
            return NextResponse.json({ error: 'order_id or invoice_id is required' }, { status: 400 });
        }

        // 1. Fetch the entity (Order or Invoice) to get the amount and business_id
        if (order_id) {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('total_amount, business_id')
                .eq('id', order_id)
                .single();

            if (orderError || !order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }
            amount = order.total_amount;
            businessId = order.business_id;
            description = `Payment for Order #${order_id.substring(0, 8)}`;
        } else if (invoice_id) {
            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices')
                .select('total_amount, invoice_number, business_id')
                .eq('id', invoice_id)
                .single();

            if (invoiceError || !invoice) {
                return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            }
            amount = invoice.total_amount;
            businessId = invoice.business_id;
            description = `Payment for Invoice ${invoice.invoice_number}`;
        }

        // 2. Fetch Stripe integration config from DB scoped to the specific business
        const { data: stripeIntegration, error: integrationError } = await supabase
            .from('integrations')
            .select('secret_key')
            .eq('provider', 'stripe')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .single();

        if (integrationError || !stripeIntegration || !stripeIntegration.secret_key) {
            return NextResponse.json({ error: 'Stripe integration is not configured or is inactive.' }, { status: 400 });
        }

        const stripe = new Stripe(stripeIntegration.secret_key, {});

        // 3. Fetch currency from settings for this business
        const { data: settings } = await supabase.from('settings').select('currency').eq('business_id', businessId).single();
        if (settings?.currency) {
            currency = settings.currency.toLowerCase();
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Invalid checkout amount' }, { status: 400 });
        }

        // 3. Create Stripe Checkout Session
        const origin = req.headers.get("origin") || 'http://localhost:3000';

        const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
        const multiplier = zeroDecimalCurrencies.includes(currency) ? 1 : 100;

        const successUrl = invoice_id ? `${origin}/pay/${invoice_id}?success=true` : `${origin}/dashboard/sales?success=true`;
        const cancelUrl = invoice_id ? `${origin}/pay/${invoice_id}?canceled=true` : `${origin}/dashboard/sales?canceled=true`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency,
                        product_data: {
                            name: description,
                        },
                        unit_amount: Math.round(amount * multiplier),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: referenceId,
            metadata: {
                order_id: order_id || null,
                invoice_id: invoice_id || null,
            }
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('Error creating Stripe session:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
