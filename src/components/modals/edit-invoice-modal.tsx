"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useFinanceStore, Invoice } from "@/store/finance-store";
import { useCustomersStore } from "@/store/customers-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export const EditInvoiceModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const formatCurrency = useFormatCurrency();
    const { updateInvoice } = useFinanceStore();
    const { customers } = useCustomersStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "EDIT_INVOICE";
    const invoice = data as Invoice;

    const [customerName, setCustomerName] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [dueDate, setDueDate] = useState("");

    // Line Items State
    const [items, setItems] = useState<{ description: string; qty: number; unitPrice: number; amount: number }[]>([]);

    // Notes
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (isModalOpen && invoice) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCustomerName(invoice.customer.name);
            // Format dates for input type="date"
            const formatDate = (dateStr: string) => {
                try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return "";
                    return d.toISOString().split('T')[0];
                } catch { return ""; }
            };

            setIssueDate(formatDate(invoice.issueDate) || "");
            setDueDate(formatDate(invoice.dueDate) || "");

            // Initialize items or default to one empty item if none
            if (invoice.items && invoice.items.length > 0) {
                setItems(invoice.items);
            } else {
                setItems([
                    { description: "Service Charge", qty: 1, unitPrice: invoice.amount, amount: invoice.amount }
                ]);
            }
        }
    }, [isModalOpen, invoice]);

    // Calculate Totals
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const taxRate = 0.16;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = { ...newItems[index] } as any;
        item[field] = value;

        // Recalculate amount for this line
        if (field === 'qty' || field === 'unitPrice') {
            item.amount = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: "", qty: 1, unitPrice: 0, amount: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const onSubmit = (status: 'Draft' | 'Sent') => {
        if (!invoice) return;

        // Find customer email if name changed
        const selectedCustomer = customers.find(c => c.name === customerName);
        const email = selectedCustomer ? selectedCustomer.email : invoice.customer.email;
        const customerId = selectedCustomer ? selectedCustomer.id : invoice.customer.id;

        // Re-format dates back to M/D/YYYY for consistency with store
        const formatDateForStore = (isoDate: string) => {
            if (!isoDate) return "";
            const d = new Date(isoDate);
            return d.toLocaleDateString('en-US'); // e.g., 1/15/2026
        };

        const updatedInvoice: Partial<Invoice> = {
            customer: {
                id: customerId,
                name: customerName,
                email: email
            },
            issueDate: formatDateForStore(issueDate),
            dueDate: formatDateForStore(dueDate),
            amount: total,
            status: status,
            items: items.map(item => ({
                ...item,
                qty: Number(item.qty),
                unitPrice: Number(item.unitPrice),
                amount: Number(item.qty) * Number(item.unitPrice)
            }))
        };

        updateInvoice(invoice.id, updatedInvoice);
        addToast('success', status === 'Draft' ? 'Invoice saved as draft' : 'Invoice updated and sent');
        onClose();
    };

    if (!isModalOpen || !invoice) return null;

    return (
        <Modal
            title="Edit Invoice"
            description={invoice.id}
            isOpen={isModalOpen}
            onClose={onClose}
            maxWidth="max-w-5xl"
        >
            <div className="space-y-8">
                {/* Header Inputs */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Customer <span className="text-red-500">*</span></label>
                        <select
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value={invoice.customer.name}>{invoice.customer.name}</option>
                            {customers.filter(c => c.name !== invoice.customer.name).map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Issue Date</label>
                            <input
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Line Items <span className="text-red-500">*</span></label>
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                        >
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium w-1/2">Description</th>
                                    <th className="px-4 py-3 text-center font-medium w-24">Qty</th>
                                    <th className="px-4 py-3 text-right font-medium w-32">Unit Price</th>
                                    <th className="px-4 py-3 text-right font-medium w-32">Amount</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, index) => (
                                    <tr key={index} className="group">
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                placeholder="Item description"
                                                className="w-full px-2 py-1 border-none focus:ring-0 text-slate-900 placeholder:text-slate-300"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value))}
                                                className="w-full text-center px-2 py-1 border-none focus:ring-0 text-slate-900"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                                                className="w-full text-right px-2 py-1 border-none focus:ring-0 text-slate-900"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold text-slate-900">
                                            {formatCurrency(item.amount || 0)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals & Notes */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes or payment terms..."
                            className="w-full h-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        ></textarea>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal:</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Tax (16%):</span>
                            <span className="font-medium">{formatCurrency(tax)}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                            <span className="font-bold text-slate-900 text-lg">Total:</span>
                            <span className="font-bold text-slate-900 text-lg">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit('Draft')}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Save as Draft
                    </button>
                    <button
                        onClick={() => onSubmit('Sent')}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Update & Send
                    </button>
                </div>
            </div>
        </Modal>
    )
}
