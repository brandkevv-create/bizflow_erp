import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const rawBody = await req.json();

        // 1. Extract context from query params since Mpesa payload doesn't have it natively
        const url = new URL(req.url);
        const businessId = url.searchParams.get('b');
        const referenceId = url.searchParams.get('ref');

        if (!businessId || !referenceId) {
            return new NextResponse('Missing Business ID or Reference ID', { status: 400 });
        }

        const stkCallback = rawBody?.Body?.stkCallback;
        if (!stkCallback) {
            return new NextResponse('Invalid M-Pesa Callback Payload', { status: 400 });
        }

        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;
        const checkoutRequestId = stkCallback.CheckoutRequestID;

        // Log the incoming webhook securely tagged with the business_id
        await supabase.from('webhook_logs').insert({
            business_id: businessId,
            provider: 'mpesa',
            event_type: 'stk_callback',
            payload: rawBody,
            status: resultCode === 0 ? 'processed' : 'failed',
            error_message: resultCode !== 0 ? resultDesc : null
        });

        // If the payment was successful (ResultCode === 0)
        if (resultCode === 0) {
            // Extract the M-Pesa Receipt Number and Paid Amount from the Item metadata array
            const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];

            let mpesaReceiptNumber = '';
            let amountPaid = 0;

            callbackMetadata.forEach((item: any) => {
                if (item.Name === 'MpesaReceiptNumber') {
                    mpesaReceiptNumber = item.Value;
                }
                if (item.Name === 'Amount') {
                    amountPaid = item.Value;
                }
            });

            // Figure out if reference was an Order or an Invoice
            const { data: order } = await supabase
                .from('orders')
                .select('id')
                .eq('id', referenceId)
                .single();

            if (order) {
                // Update Order Status
                await supabase.from('orders').update({ status: 'Paid' }).eq('id', referenceId);

                // Construct payment record
                await supabase.from('payments').insert({
                    business_id: businessId,
                    order_id: referenceId,
                    amount: amountPaid,
                    payment_method: 'M-Pesa',
                    status: 'Completed',
                    reference: mpesaReceiptNumber,
                    notes: `CheckoutRequestID: ${checkoutRequestId}`
                });
            } else {
                // Check if it's an Invoice
                const { data: invoice } = await supabase
                    .from('invoices')
                    .select('id')
                    .eq('id', referenceId)
                    .single();

                if (invoice) {
                    await supabase.from('invoices').update({ status: 'Paid', paid_amount: amountPaid }).eq('id', referenceId);

                    await supabase.from('payments').insert({
                        business_id: businessId,
                        invoice_id: referenceId,
                        amount: amountPaid,
                        payment_method: 'M-Pesa',
                        status: 'Completed',
                        reference: mpesaReceiptNumber,
                        notes: `CheckoutRequestID: ${checkoutRequestId}`
                    });
                }
            }
        }

        // Must acknowledge Safaricom M-Pesa's POST request so it stops retrying
        return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });

    } catch (error: any) {
        console.error('M-Pesa Webhook Error:', error);

        // Return 200 so Mpesa stops retrying, even on our server error,
        // but perhaps you want them to retry. Usually, you return success.
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
    }
}
