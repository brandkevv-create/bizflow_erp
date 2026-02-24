import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { PaymentPanel } from './payment-panel';
import { Building2, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicInvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
    const { invoiceId } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch Invoice with bypass RLS to display to the public
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
            *,
            customer:customers(full_name, email, phone, address),
            items:invoice_items(*),
            business:businesses(name)
        `)
        .eq('id', invoiceId)
        .single();

    if (invoiceError || !invoice) {
        return notFound();
    }

    const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .eq('id', invoice.business_id)
        .single();

    const currency = settings?.currency || 'USD';
    const totalAmount = Number(invoice.total_amount);
    const paidAmount = Number(invoice.paid_amount || 0);
    const balanceDue = totalAmount - paidAmount;
    const isPaid = invoice.status === 'Paid' || balanceDue <= 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Branding */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-12 h-12 rounded object-cover" />
                        ) : (
                            <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white">
                                <Building2 size={24} />
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{settings?.business_name || invoice.business?.name || 'BizFlow Merchant'}</h1>
                            <p className="text-sm text-slate-500">Invoice #{invoice.invoice_number}</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {isPaid ? 'Paid' : 'Due'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Invoice Document */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                            {/* Invoice Meta */}
                            <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
                                    <h2 className="text-lg font-semibold text-slate-900">{invoice.customer?.full_name}</h2>
                                    <div className="mt-1 space-y-1 text-sm text-slate-500">
                                        <p className="flex items-center gap-2"><Mail size={14} /> {invoice.customer?.email}</p>
                                        {invoice.customer?.phone && <p className="flex items-center gap-2"><Phone size={14} /> {invoice.customer.phone}</p>}
                                        {invoice.customer?.address && <p className="mt-2 text-slate-600 max-w-[200px]">{invoice.customer.address}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Details</p>
                                    <div className="space-y-1 text-sm text-slate-600">
                                        <p className="flex items-center justify-end gap-2"><span className="text-slate-400">Date:</span> {new Date(invoice.issue_date).toLocaleDateString()}</p>
                                        <p className="flex items-center justify-end gap-2"><span className="text-slate-400">Due:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="px-8 py-6">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-sm font-semibold text-slate-900">
                                            <th className="pb-3 text-left">Description</th>
                                            <th className="pb-3 text-right">Qty</th>
                                            <th className="pb-3 text-right">Price</th>
                                            <th className="pb-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {invoice.items?.map((item: any) => (
                                            <tr key={item.id} className="text-slate-600">
                                                <td className="py-4 font-medium text-slate-900">{item.description}</td>
                                                <td className="py-4 text-right">{item.quantity}</td>
                                                <td className="py-4 text-right">{formatCurrency(item.unit_price)}</td>
                                                <td className="py-4 text-right text-slate-900 font-medium">{formatCurrency(item.total_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="bg-slate-50 p-8 border-t border-slate-100 flex justify-end">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Discount {invoice.discount_percentage ? `(${invoice.discount_percentage}%)` : ''}</span>
                                        <span className="font-medium text-slate-900">-{formatCurrency(Number(invoice.discount_amount) || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-3">
                                        <span>Tax</span>
                                        <span className="font-medium text-slate-900">+{formatCurrency(Number(invoice.tax_amount) || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-base font-bold text-slate-900">Total</span>
                                        <span className="text-xl font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
                                    </div>
                                    {paidAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600 pt-2">
                                            <span>Paid</span>
                                            <span className="font-bold">-{formatCurrency(paidAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Payment Panel Sidebar */}
                    <div className="md:col-span-1">
                        <PaymentPanel
                            invoiceId={invoice.id}
                            balanceDue={balanceDue}
                            isPaid={isPaid}
                            currency={currency}
                        />

                        {/* Additional Info Block */}
                        <div className="mt-6 bg-slate-100 rounded-xl p-6 text-sm text-slate-500">
                            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <ArrowRight size={16} /> Business Contact
                            </h4>
                            <p>{settings?.business_name}</p>
                            <p>{settings?.business_email}</p>
                            <p>{settings?.phone}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
