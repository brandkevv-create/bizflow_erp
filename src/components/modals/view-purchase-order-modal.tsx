"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { format } from "date-fns";
import { usePurchaseOrdersStore, PurchaseOrder } from "@/store/purchase-orders-store";
import { useSettingsStore } from "@/store/settings-store";
import { useToast } from "@/hooks/use-toast";
import { Download, Printer, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export const ViewPurchaseOrderModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const formatCurrency = useFormatCurrency();
    const { updatePurchaseOrderStatus, isLoading } = usePurchaseOrdersStore();
    const { business } = useSettingsStore();
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);

    const isModalOpen = isOpen && type === "VIEW_PURCHASE_ORDER";
    const po = data as PurchaseOrder;

    if (!isModalOpen || !po) return null;

    const handleUpdateStatus = async (newStatus: PurchaseOrder['status']) => {
        try {
            await updatePurchaseOrderStatus(po.id, newStatus);
            addToast("success", `Purchase order marked as ${newStatus}`);
            if (newStatus === 'received' || newStatus === 'cancelled') {
                onClose();
            }
        } catch (error) {
            addToast("error", "Failed to update purchase order status");
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById("po-document");
        if (!element) return;

        setIsGenerating(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`PO-${po.po_number}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
            addToast("error", "Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal
            title={`Purchase Order ${po.po_number}`}
            description="View PO details and manage status."
            isOpen={isModalOpen}
            onClose={onClose}
            maxWidth="max-w-4xl"
        >
            <div className="bg-slate-100 p-8 rounded-lg overflow-y-auto max-h-[75vh]">
                {/* A4 Paper Document */}
                <div id="po-document" className="bg-white shadow-sm mx-auto w-full max-w-[210mm] min-h-[297mm] flex flex-col relative text-slate-800 font-sans">

                    {/* Header Details */}
                    <div className="flex justify-between items-start pt-12 px-12 pb-8 border-b border-slate-100">
                        {/* Company Info */}
                        <div className="w-1/2">
                            {business.logo ? (
                                <div className="relative h-20 w-40 mb-4">
                                    <Image src={business.logo} alt="Company Logo" fill className="object-left object-contain" unoptimized />
                                </div>
                            ) : (
                                <div className="text-2xl font-bold tracking-tight text-slate-900 mb-2">{business.name || 'Company Name'}</div>
                            )}

                            <div className="text-sm text-slate-500 space-y-1">
                                <p className="font-medium text-slate-900">{!business.logo && (business.name || 'Company Name')}</p>
                                <p>{business.address}</p>
                                <p>{business.email}</p>
                                <p>{business.phone}</p>
                            </div>
                        </div>

                        {/* PO Title & Info */}
                        <div className="text-right">
                            <h1 className="text-3xl font-light text-slate-300 tracking-widest uppercase mb-2">PURCHASE ORDER</h1>
                            <p className="text-lg font-semibold text-slate-700">{po.po_number}</p>
                            <div className="mt-4 space-y-1 text-sm text-slate-600">
                                <p><span className="text-slate-400 mr-2">Date:</span> {format(new Date(po.created_at), 'MMM dd, yyyy')}</p>
                                <p><span className="text-slate-400 mr-2">Status:</span> <span className="uppercase font-medium">{po.status}</span></p>
                                {po.expected_date && (
                                    <p><span className="text-slate-400 mr-2">Expected:</span> {format(new Date(po.expected_date), 'MMM dd, yyyy')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Parties involved */}
                    <div className="grid grid-cols-2 px-12 py-8 gap-8">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Vendor / Supplier</p>
                            <h2 className="text-lg font-bold text-slate-900 mb-1">{po.supplier?.name}</h2>
                            <p className="text-sm text-slate-600">{po.supplier?.contact_person}</p>
                            <p className="text-sm text-slate-600">{po.supplier?.email}</p>
                            <p className="text-sm text-slate-600 mt-1">{po.supplier?.address}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ship To</p>
                            <h2 className="text-lg font-bold text-slate-900 mb-1">{po.location?.name}</h2>
                            <p className="text-sm text-slate-600 uppercase text-xs tracking-wider">{po.location?.type}</p>
                            <p className="text-sm text-slate-600 mt-1">{po.location?.address}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="px-12 py-4 flex-grow">
                        <table className="w-full whitespace-nowrap">
                            <thead>
                                <tr className="border-b-2 border-slate-100 text-slate-500">
                                    <th className="py-3 text-left text-xs uppercase tracking-wider font-semibold">Item</th>
                                    <th className="py-3 text-center text-xs uppercase tracking-wider font-semibold w-24">Order Qty</th>
                                    <th className="py-3 text-right text-xs uppercase tracking-wider font-semibold w-32">Unit Cost</th>
                                    <th className="py-3 text-right text-xs uppercase tracking-wider font-semibold w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {po.items && po.items.length > 0 ? po.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-4 text-sm font-medium text-slate-800">{item.product?.name || 'Unknown Product'}</td>
                                        <td className="py-4 text-center text-sm text-slate-600">{item.quantity}</td>
                                        <td className="py-4 text-right text-sm text-slate-600">{formatCurrency(item.unit_cost || 0)}</td>
                                        <td className="py-4 text-right text-sm font-semibold text-slate-800">{formatCurrency((item.quantity || 0) * (item.unit_cost || 0))}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic">No items found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="px-12 py-8 flex justify-end">
                        <div className="w-80 space-y-3">
                            <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 mt-2">
                                <span className="text-base font-bold text-slate-900 uppercase">PO Total</span>
                                <span className="text-2xl font-bold text-slate-900">{formatCurrency(po.total_amount || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Notes */}
                    <div className="mt-auto bg-slate-50 px-12 py-8 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Terms & Conditions</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Please send two copies of your invoice. Enter this order in accordance with the prices, terms, delivery method, and specifications listed above. Please notify us immediately if you are unable to ship as specified.
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="mt-8 pt-4 border-t border-slate-300 inline-block w-48 text-center">
                                    <span className="text-xs font-medium text-slate-500 uppercase">Authorized Signature</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                    {po.status === 'draft' && (
                        <button
                            onClick={() => handleUpdateStatus('ordered')}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Place Order'}
                        </button>
                    )}
                    {po.status === 'ordered' && (
                        <button
                            onClick={() => handleUpdateStatus('received')}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Mark as Received'}
                        </button>
                    )}
                    {(po.status === 'draft' || po.status === 'ordered') && (
                        <button
                            onClick={() => handleUpdateStatus('cancelled')}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                        >
                            Cancel PO
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {isGenerating ? "Generating..." : "Download PDF"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
