"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { Invoice } from "@/store/finance-store";
import { useSettingsStore } from "@/store/settings-store";
import { Download, Printer, Loader2, Link as LinkIcon, CheckCircle2, Mail } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { useFinanceStore } from "@/store/finance-store";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export const ViewInvoiceModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const formatCurrency = useFormatCurrency();
    const { business } = useSettingsStore();
    const { fetchInvoices } = useFinanceStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [copied, setCopied] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const isModalOpen = isOpen && type === "VIEW_INVOICE";
    const invoice = data as Invoice;

    if (!isModalOpen || !invoice) return null;

    const itemsTotal = invoice.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const hasItems = invoice.items && invoice.items.length > 0;

    // Logic for totals presentation
    const calculatedTax = (invoice.amount - itemsTotal);
    const taxToDisplay = calculatedTax > 0 ? calculatedTax : 0;
    const subTotalToDisplay = itemsTotal > 0 ? itemsTotal : invoice.amount;
    const taxPercentage = subTotalToDisplay > 0 ? ((taxToDisplay / subTotalToDisplay) * 100).toFixed(0) : "0";

    const handleDownloadPDF = async () => {
        const element = document.getElementById("invoice-document");
        if (!element) return;

        setIsGenerating(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`invoice-${invoice.invoiceNumber || invoice.id.split('-')[0].toUpperCase()}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleGenerateLink = async () => {
        const publicUrl = `${window.location.origin}/pay/${invoice.id}`;
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendEmail = async () => {
        setIsSendingEmail(true);
        try {
            const res = await fetch(`/api/invoices/${invoice.id}/send-email`, {
                method: 'POST'
            });
            const data = await res.json();

            if (res.ok) {
                setEmailSent(true);
                setTimeout(() => setEmailSent(false), 3000);
                await fetchInvoices(); // Refresh status if changed
            } else {
                alert(data.error || 'Failed to send email');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to send email');
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <Modal
            title="Invoice Preview"
            description="Preview before sending"
            isOpen={isModalOpen}
            onClose={onClose}
            maxWidth="max-w-4xl"
        >
            <div className="bg-slate-100 p-8 rounded-lg overflow-y-auto max-h-[80vh]">
                {/* A4 Paper Effect */}
                <div id="invoice-document" className="bg-white shadow-xl mx-auto w-full max-w-[210mm] min-h-[297mm] flex flex-col relative text-slate-800 font-sans">

                    {/* Header Section */}
                    <div className="flex justify-between items-start pt-12 px-12 pb-8 border-b border-slate-100">
                        {/* Logo / Company Info */}
                        <div className="w-1/2">
                            {business.logo ? (
                                <div className="relative h-24 w-48 mb-4">
                                    <Image src={business.logo} alt="Company Logo" fill className="object-left object-contain" unoptimized />
                                </div>
                            ) : (
                                <div className="text-3xl font-bold tracking-tight text-slate-900 mb-2">{business.name || 'Company Name'}</div>
                            )}

                            <div className="text-sm text-slate-500 space-y-1">
                                <p className="font-medium text-slate-900">{!business.logo && (business.name || 'Company Name')}</p>
                                <p>{business.address}</p>
                                <p>{business.email}</p>
                                <p>{business.phone}</p>
                            </div>
                        </div>

                        {/* Invoice Title & ID */}
                        <div className="text-right">
                            <h1 className="text-4xl font-light text-slate-300 tracking-widest uppercase mb-2">INVOICE</h1>
                            <p className="text-lg font-semibold text-slate-700">#{invoice.invoiceNumber || invoice.id.split('-')[0].toUpperCase()}</p>
                            <div className="mt-4 space-y-1 text-sm text-slate-600">
                                <p><span className="text-slate-400 mr-2">Start Date:</span> {invoice.issueDate}</p>
                                <p><span className="text-slate-400 mr-2">Due Date:</span> {invoice.dueDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="px-12 py-8">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">{invoice.customer.name}</h2>
                        <p className="text-sm text-slate-500">{invoice.customer.email}</p>
                    </div>

                    {/* Table */}
                    <div className="px-12 py-4 flex-grow">
                        <table className="w-full whitespace-nowrap">
                            <thead>
                                <tr className="border-b-2 border-slate-100 text-slate-500">
                                    <th className="py-3 text-left text-xs uppercase tracking-wider font-semibold w-12">#</th>
                                    <th className="py-3 text-left text-xs uppercase tracking-wider font-semibold">Description</th>
                                    <th className="py-3 text-right text-xs uppercase tracking-wider font-semibold w-32">Price</th>
                                    <th className="py-3 text-center text-xs uppercase tracking-wider font-semibold w-24">Qty</th>
                                    <th className="py-3 text-right text-xs uppercase tracking-wider font-semibold w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {hasItems ? invoice.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4 text-sm text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-4 text-sm font-medium text-slate-800">{item.description}</td>
                                        <td className="py-4 text-right text-sm text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                        <td className="py-4 text-center text-sm text-slate-600">{item.qty}</td>
                                        <td className="py-4 text-right text-sm font-semibold text-slate-800">{formatCurrency(item.amount)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No items available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="px-12 py-8 flex justify-end">
                        <div className="w-80 space-y-3">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-medium">{formatCurrency(subTotalToDisplay)}</span>
                            </div>
                            {taxToDisplay > 0 && (
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Tax ({taxPercentage}%)</span>
                                    <span className="font-medium">{formatCurrency(taxToDisplay)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 mt-2">
                                <span className="text-base font-bold text-slate-900 uppercase">Total Due</span>
                                <span className="text-2xl font-bold text-slate-900">{formatCurrency(invoice.amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Terms */}
                    <div className="mt-auto bg-slate-50 px-12 py-8 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Payment Terms</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Please pay within 30 days of receiving this invoice.
                                    Bank Transfer Details: <br />
                                    <strong>Bank:</strong> City Bank <br />
                                    <strong>Account:</strong> 1234-5678-9012
                                </p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Thank You</h4>
                                <p className="text-xs text-slate-500 italic">
                                    We appreciate your business. Please contact us if you have any questions about this invoice.
                                </p>
                                <div className="mt-4 pt-4 border-t border-slate-200 inline-block w-48 text-center">
                                    <span className="text-xs font-medium text-slate-400 uppercase">Authorized Signature</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-4">
                <div className="flex gap-2 text-sm text-slate-500 items-center">
                    <button
                        onClick={handleSendEmail}
                        disabled={isSendingEmail}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${emailSent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {isSendingEmail ? <Loader2 size={16} className="animate-spin" /> : emailSent ? <CheckCircle2 size={16} /> : <Mail size={16} />}
                        {emailSent ? "Email Sent!" : "Send Email"}
                    </button>
                    {(invoice.status === 'Sent' || invoice.status === 'Draft' || invoice.status === 'Overdue') && (
                        <button
                            onClick={handleGenerateLink}
                            disabled={isGeneratingLink}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'} disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {isGeneratingLink ? <Loader2 size={16} className="animate-spin" /> : copied ? <CheckCircle2 size={16} /> : <LinkIcon size={16} />}
                            {copied ? "Copied!" : invoice.paymentLinkUrl ? "Copy Payment Link" : "Generate Payment Link"}
                        </button>
                    )}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm">
                        Close Preview
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm"
                        >
                            <Printer size={16} />
                            Print
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {isGenerating ? "Generating..." : "Download PDF"}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

