import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: invoiceId } = await params;

        if (!invoiceId) {
            return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
        }

        // 1. Fetch Invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
                *,
                customer:customers(full_name, email)
            `)
            .eq('id', invoiceId)
            .single();

        if (invoiceError || !invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (!invoice.customer?.email) {
            return NextResponse.json({ error: 'Customer has no email address' }, { status: 400 });
        }

        // 2. See if we have an Email provider integration (Resend mock or real)
        const { data: integration } = await supabase
            .from('integrations')
            .select('secret_key')
            .eq('provider', 'resend')
            .eq('is_active', true)
            .single();

        const resendApiKey = integration?.secret_key || process.env.RESEND_API_KEY;

        const paymentLink = invoice.payment_link_url
            ? `<p>You can pay online securely here: <a href="${invoice.payment_link_url}">Pay Invoice</a></p>`
            : '';

        const htmlBody = `
            <h2>Invoice ${invoice.invoice_number}</h2>
            <p>Dear ${invoice.customer.full_name},</p>
            <p>Your invoice for the amount of $${invoice.total_amount} is ready.</p>
            ${paymentLink}
            <br/>
            <p>Thank you for your business!</p>
        `;

        // 3. Send Email
        if (resendApiKey) {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                    from: 'BizFlow ERP <billing@bizflow.app>', // Must be a verified domain in Resend
                    to: [invoice.customer.email],
                    subject: `Invoice ${invoice.invoice_number} from BizFlow`,
                    html: htmlBody
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Resend Error:", errorData);
                return NextResponse.json({ error: 'Failed to send email via provider' }, { status: 500 });
            }
        } else {
            // Simulated delivery
            console.log(`[SIMULATED EMAIL] To: ${invoice.customer.email}\nSubject: Invoice ${invoice.invoice_number}\nBody: ${htmlBody}`);
        }

        // 4. Update Invoice Status to 'Sent' if it was 'Draft'
        if (invoice.status === 'Draft') {
            await supabase.from('invoices').update({ status: 'Sent' }).eq('id', invoiceId);
        }

        return NextResponse.json({ success: true, message: 'Email sent successfully' });

    } catch (error: any) {
        console.error('Email Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
