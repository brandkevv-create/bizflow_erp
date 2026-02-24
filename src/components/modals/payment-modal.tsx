"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useFinanceStore } from "@/store/finance-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";

export const PaymentModal = () => {
    const { isOpen, onClose, type } = useModal();
    const { invoices, addPayment } = useFinanceStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "ADD_PAYMENT";

    const [invoiceId, setInvoiceId] = useState("");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState<"Bank Transfer" | "Credit Card" | "Mobile Money" | "Check" | "Cash">("Bank Transfer");
    const [date, setDate] = useState("");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");

    // Reset
    useEffect(() => {
        if (isModalOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInvoiceId("");
            setAmount("");
            setMethod("Bank Transfer");
            setDate(new Date().toISOString().split('T')[0]);
            setReference("");
            setNotes("");
        }
    }, [isModalOpen]);

    // Auto-fill amount when invoice is selected
    useEffect(() => {
        if (invoiceId) {
            const inv = invoices.find(i => i.id === invoiceId);
            if (inv) {
                const remaining = inv.amount - inv.paidAmount;
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setAmount(remaining.toString());
            }
        }
    }, [invoiceId, invoices]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedInvoice = invoices.find(i => i.id === invoiceId);
        if (!selectedInvoice) return;

        const newPayment = {
            id: `PAY-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            invoiceId,
            customer: selectedInvoice.customer.name,
            date: new Date(date).toLocaleDateString('en-US'),
            method: method as 'Bank Transfer' | 'Credit Card' | 'Mobile Money' | 'Check',
            amount: parseFloat(amount),
            status: 'Completed' as const,
            reference: reference || undefined,
            notes: notes || undefined
        };

        addPayment(newPayment);
        addToast('success', 'Payment recorded successfully');
        onClose();
    };



    return (
        <Modal
            title="Record Payment"
            description="Record a payment received from a customer"
            isOpen={isModalOpen}
            onClose={onClose}
            maxWidth="max-w-2xl"
        >
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Invoice Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            required
                            type="text"
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            placeholder="Enter Invoice Number (e.g. INV-2026-001)"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        {invoiceId && invoices.find(i => i.id === invoiceId) && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 flex items-center gap-1 text-xs font-medium bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                <span>✓</span>
                                {invoices.find(i => i.id === invoiceId)?.customer.name}
                            </div>
                        )}
                        {invoiceId && !invoices.find(i => i.id === invoiceId) && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">
                                Not found
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Amount <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-sm">$</span>
                            </div>
                            <input
                                required
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Payment Date</label>
                        <div className="relative">
                            <input
                                required
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-600 appearance-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Payment Method</label>
                    <div className="relative">
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as typeof method)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none"
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Check">Check</option>
                            <option value="Cash">Cash</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <CreditCard className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Reference Number</label>
                    <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Transaction ID or check number"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes..."
                        className="w-full h-24 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm">
                        Cancel
                    </button>
                    <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm">
                        Record Payment
                    </button>
                </div>
            </form>
        </Modal>
    )
}
