import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Admin key needed to insert payments and update orders securely
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    // 1. Extract Business ID from query params
    const url = new URL(req.url);
    const businessId = url.searchParams.get('b');

    if (!businessId) {
        return new NextResponse('Missing Business ID query parameter (?b=...)', { status: 400 });
    }

    let stripeIntegration: { secret_key: string, api_key: string } | null = null;
    let event: Stripe.Event;

    try {
        const { data, error } = await supabase
            .from('integrations')
            .select('secret_key, api_key')
            .eq('provider', 'stripe')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .single();

        if (error || !data || !data.secret_key) {
            return new NextResponse('Stripe integration disabled for this tenant', { status: 400 });
        }
        stripeIntegration = data;

        const stripe = new Stripe(stripeIntegration.secret_key, {});

        // Use api_key field as webhook secret, fallback to env variable
        const webhookSecret = stripeIntegration.api_key || process.env.STRIPE_WEBHOOK_SECRET;

        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } else {
            // Unverified parsing for local testing without ngrok
            event = JSON.parse(rawBody) as Stripe.Event;
        }
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        // Log webhook - injecting business_id
        await supabase.from('webhook_logs').insert({
            business_id: businessId,
            provider: 'stripe',
            event_type: event.type,
            payload: event as unknown as Record<string, any>,
            status: 'pending'
        });

        // Handle the checkout.session.completed event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            const sessionCurrency = session.currency || 'usd';
            const zeroDecimalCurrencies = ['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf'];
            const multiplier = zeroDecimalCurrencies.includes(sessionCurrency.toLowerCase()) ? 1 : 100;

            const amountTotal = session.amount_total ? session.amount_total / multiplier : 0;
            const orderId = session.metadata?.order_id;
            const invoiceId = session.metadata?.invoice_id;
            const customerId = session.client_reference_id; // we passed orderId or invoiceId here

            if (orderId) {
                // Update Order Status
                await supabase.from('orders').update({ status: 'Paid' }).eq('id', orderId);

                // Construct payment record - injecting business_id
                await supabase.from('payments').insert({
                    business_id: businessId,
                    order_id: orderId,
                    amount: amountTotal,
                    payment_method: 'Stripe',
                    status: 'Completed',
                    reference: session.payment_intent as string,
                });

            } else if (invoiceId) {
                // Update Invoice Status
                await supabase.from('invoices').update({ status: 'Paid', paid_amount: amountTotal }).eq('id', invoiceId);

                // Construct payment record - injecting business_id
                await supabase.from('payments').insert({
                    business_id: businessId,
                    invoice_id: invoiceId,
                    amount: amountTotal,
                    payment_method: 'Stripe',
                    status: 'Completed',
                    reference: session.payment_intent as string,
                });
            }

            // Update log status to processed
            await supabase.from('webhook_logs')
                .update({ status: 'processed', processed_at: new Date().toISOString() })
                .eq('event_type', event.type)
                .is('processed_at', null);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook handler failed:', error);

        // Log failure
        await supabase.from('webhook_logs').insert({
            business_id: businessId,
            provider: 'stripe',
            event_type: event.type,
            payload: event as unknown as Record<string, any>,
            status: 'failed',
            error_message: error.message
        });

        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
