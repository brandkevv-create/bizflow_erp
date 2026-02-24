import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to generate Safaricom Daraja OAuth Token
async function getMpesaToken(consumerKey: string, consumerSecret: string, isProduction: boolean = false) {
    const url = isProduction
        ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await axios.get(url, {
        headers: {
            Authorization: `Basic ${auth}`
        }
    });

    return response.data.access_token;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, invoice_id, phone_number } = body;

        let referenceId = order_id || invoice_id;
        let amount = 0;
        let businessId = '';
        let referenceNumber = '';

        if (!referenceId) {
            return NextResponse.json({ error: 'order_id or invoice_id is required' }, { status: 400 });
        }

        if (!phone_number) {
            return NextResponse.json({ error: 'phone_number is required for M-Pesa STK push' }, { status: 400 });
        }

        // Format phone number to start with 254
        let formattedPhone = phone_number.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
            formattedPhone = '254' + formattedPhone;
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
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
            referenceNumber = order_id.substring(0, 8);
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
            referenceNumber = invoice.invoice_number;
        }

        // 2. Fetch M-Pesa integration config from DB scoped to the specific business
        const { data: mpesaIntegration, error: integrationError } = await supabase
            .from('integrations')
            .select('api_key, secret_key, shop_url')
            .eq('provider', 'mpesa')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .single();

        if (integrationError || !mpesaIntegration || !mpesaIntegration.api_key || !mpesaIntegration.secret_key || !mpesaIntegration.shop_url) {
            return NextResponse.json({ error: 'M-Pesa integration is not configured correctly or is inactive.' }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Invalid checkout amount' }, { status: 400 });
        }

        // Configuration Mapping
        // api_key = Consumer Key
        // secret_key = Consumer Secret
        // shop_url = Paybill / Till Number + Passkey (format: "PAYBILL|PASSKEY" or just "PAYBILL" if we assume sandbox passkey)

        const configParts = mpesaIntegration.shop_url.split('|');
        const shortCode = configParts[0];

        // Use provided passkey or fallback to Safaricom Sandbox default passkey
        const passkey = configParts.length > 1 ? configParts[1] : 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

        // Environment determination: If no passkey was explicitly stored with a |, it's likely a sandbox run, but you should adjust this logic based on your production vs sandbox toggles
        const isProduction = !!process.env.MPESA_PRODUCTION;

        // 3. Generate M-Pesa Token
        const token = await getMpesaToken(mpesaIntegration.api_key, mpesaIntegration.secret_key, isProduction);

        // 4. Form STK Push Payload
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

        const origin = req.headers.get("origin") || 'http://localhost:3000';
        const callbackUrl = `${origin}/api/webhooks/mpesa?b=${businessId}&ref=${referenceId}`; // Webhook needs business target

        const stkPushUrl = isProduction
            ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
            : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

        const stpPayload = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline", // Or "CustomerBuyGoodsOnline" depending on till type
            Amount: Math.ceil(amount), // Mpesa only takes integers
            PartyA: formattedPhone,
            PartyB: shortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: referenceNumber,
            TransactionDesc: `Payment for ${referenceNumber}`
        };

        const response = await axios.post(stkPushUrl, stpPayload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Response contains CheckoutRequestID which is needed to track the transaction
        return NextResponse.json({
            success: true,
            message: 'STK Push sent successfully',
            checkoutRequestId: response.data.CheckoutRequestID,
            customerMessage: response.data.CustomerMessage
        });

    } catch (error: any) {
        console.error('Error initiating M-Pesa STK Push:', error);
        if (axios.isAxiosError(error)) {
            return NextResponse.json({ error: error.response?.data?.errorMessage || error.message }, { status: 500 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
