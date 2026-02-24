"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { Payment, useFinanceStore } from "@/store/finance-store";
import { useSettingsStore } from "@/store/settings-store";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export const ViewPaymentModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const formatCurrency = useFormatCurrency();
    const isModalOpen = isOpen && type === "VIEW_PAYMENT";
    const payment = data as Payment;
    const [isGenerating, setIsGenerating] = useState(false);

    const { business } = useSettingsStore();
    const { invoices } = useFinanceStore();

    if (!isModalOpen || !payment) return null;

    const invoice = invoices.find(i => i.id === payment.invoiceId);

    // In actual implementation, we'd use line items from the invoice, but since an invoice
    // can have multiple partial payments, if we display items here, we should be clear that
    // this receipt is for a specific *payment amount*, which may be less than the invoice total.
    // For this design, we will show the items to match the layout.

    const itemsTotal = invoice?.items?.reduce((sum, item) => sum + item.amount, 0) || payment.amount;
    const subTotalToDisplay = itemsTotal;
    const taxToDisplay = (invoice?.amount || payment.amount) - itemsTotal;

    // Display items: either the invoice items, or a generic "Payment for X" row if no items.
    const displayItems = invoice?.items?.length ? invoice.items : [
        {
            description: `Payment for ${payment.invoiceNumber || invoice?.invoiceNumber || 'Services'}`,
            qty: 1,
            unitPrice: payment.amount,
            amount: payment.amount
        }
    ];

    const handleDownloadPDF = async () => {
        const element = document.getElementById("payment-receipt-doc");
        if (!element) return;

        setIsGenerating(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`receipt-${payment.id}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Modal
            title="Payment Receipt"
            description="View and download the professional receipt."
            isOpen={isModalOpen}
            onClose={onClose}
            maxWidth="max-w-4xl"
        >
            <div className="bg-slate-100 p-8 rounded-lg overflow-y-auto max-h-[80vh]">
                <div
                    id="payment-receipt-doc"
                    className="bg-white shadow-xl mx-auto flex flex-col relative font-sans text-slate-900"
                    style={{ width: '210mm', minHeight: '297mm', padding: '12mm' }}
                >
                    {/* Background blob shape */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-[#E8E8FA] rounded-br-[120px] -z-0 opacity-80" />

                    {/* Header Top Layer */}
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mt-4">
                            <div className="pt-4 px-4 w-1/2">
                                <h1 className="text-5xl font-black text-[#0A1938] tracking-wider mb-2">RECEIPT</h1>
                                <div className="border-b-[1.5px] border-[#0A1938] w-full mt-4 flex justify-end pb-0.5">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0A1938] translate-y-[5.5px] translate-x-1">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="text-right pt-6 text-sm flex flex-col gap-2">
                                <div className="flex justify-end items-center gap-4">
                                    <span className="font-bold text-[#0A1938] w-24">RECEIPT #</span>
                                    <span className="w-24 font-medium">{payment.id.split('-').pop()?.toUpperCase() || payment.id}</span>
                                </div>
                                <div className="flex justify-end items-center gap-4">
                                    <span className="font-bold text-[#0A1938] w-24">DATE</span>
                                    <span className="w-24 font-medium">{payment.date}</span>
                                </div>
                            </div>
                        </div>

                        {/* Addresses Info */}
                        <div className="flex justify-between mt-16 px-4">
                            <div className="space-y-1 text-sm w-1/2">
                                <p className="font-bold text-[#0A1938] mb-2">{business.name || '[Your Company Name]'}</p>
                                <p className="text-slate-700">{business.address || '[Your Address]'}</p>
                                <p className="text-slate-700">{business.phone || '[Phone Number]'}</p>
                                <p className="text-slate-700">{business.email || '[Email Address]'}</p>
                            </div>
                            <div className="space-y-1 text-sm w-1/2 flex flex-col items-start pl-16">
                                <p className="font-bold text-[#0A1938] mb-2">Customer Information:</p>
                                <p className="text-slate-700">{payment.customer || '[Customer Name]'}</p>
                                {invoice?.customer?.email && (
                                    <p className="text-slate-700">{invoice.customer.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="mt-12 w-full px-4">
                            <table className="w-full text-sm whitespace-nowrap">
                                <thead className="bg-[#E8E8FA] text-[#0A1938]">
                                    <tr>
                                        <th className="py-2.5 px-4 text-left font-bold">Description</th>
                                        <th className="py-2.5 px-4 text-center font-bold">Qty</th>
                                        <th className="py-2.5 px-4 text-right font-bold w-32">Unit Price</th>
                                        <th className="py-2.5 px-4 text-right font-bold w-32">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayItems.map((item, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-[#E8E8FA]/40'}>
                                            <td className="py-2.5 px-4 text-left font-medium">{item.description}</td>
                                            <td className="py-2.5 px-4 text-center">{item.qty}</td>
                                            <td className="py-2.5 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="py-2.5 px-4 text-right">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                    {/* Empty rows to fill space if needed */}
                                    {Array.from({ length: Math.max(0, 5 - displayItems.length) }).map((_, idx) => (
                                        <tr key={`empty-${idx}`} className={(displayItems.length + idx) % 2 === 0 ? 'bg-slate-50' : 'bg-[#E8E8FA]/40'}>
                                            <td className="py-2.5 px-4 h-10"></td>
                                            <td className="py-2.5 px-4 h-10"></td>
                                            <td className="py-2.5 px-4 h-10"></td>
                                            <td className="py-2.5 px-4 h-10"></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="mt-6 flex justify-end px-4">
                            <div className="w-64 space-y-3 text-sm">
                                <div className="flex justify-between items-center pr-4">
                                    <span className="font-bold text-[#0A1938]">Subtotal</span>
                                    <span className="font-medium flex justify-end w-24">{formatCurrency(subTotalToDisplay)}</span>
                                </div>
                                <div className="flex justify-between items-center pr-4">
                                    <span className="font-bold text-[#0A1938]">TAX</span>
                                    <span className="font-medium flex justify-end w-24">{formatCurrency(taxToDisplay)}</span>
                                </div>
                                <div className="flex justify-between items-center border border-[#0A1938] px-4 py-2 mt-2">
                                    <span className="font-bold text-[#0A1938]">TOTAL</span>
                                    <span className="font-bold flex justify-end w-24">{formatCurrency(invoice?.amount || payment.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="mt-16 px-4 space-y-1 text-sm">
                            <p className="font-bold text-[#0A1938]">Payment Method:</p>
                            <p className="text-slate-700">Payment made via {payment.method}. {payment.reference ? `Ref: ${payment.reference}` : ''}</p>
                        </div>

                        {/* Amount Paid section */}
                        <div className="mt-10 px-4 space-y-1 text-sm">
                            <p className="font-bold text-[#0A1938]">Amount Paid:</p>
                            <div className="w-64 border-b border-black flex justify-end pb-1 font-bold">
                                <span>{formatCurrency(payment.amount)}</span>
                            </div>
                            {/* If paid amount is less than total, show balance */}
                            {(invoice && payment.amount < invoice.amount) && (
                                <p className="text-xs text-red-600 mt-2 font-medium">Note: Partial payment against total invoice marked above.</p>
                            )}
                        </div>

                        {/* Footer Message */}
                        <div className="mt-16 px-4 text-right">
                            <p className="font-bold text-[#0A1938]">Thank you for your business!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-4">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Close Preview
                </button>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {isGenerating ? "Generating..." : "Download Receipt"}
                </button>
            </div>
        </Modal>
    );
};
