"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useFinanceStore } from "@/store/finance-store";
import { useCustomersStore } from "@/store/customers-store";
import { useSettingsStore } from "@/store/settings-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface LineItem {
    id: string;
    description: string;
    qty: number;
    unitPrice: number;
}

export const InvoiceModal = () => {
    const { isOpen, onClose, type } = useModal();
    const { createInvoice: addInvoice } = useFinanceStore();
    const { customers } = useCustomersStore();
    const { business } = useSettingsStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "ADD_INVOICE";

    const [customerId, setCustomerId] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<LineItem[]>([
        { id: '1', description: '', qty: 1, unitPrice: 0 }
    ]);

    // Initialize defaults
    useEffect(() => {
        if (isModalOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCustomerId("");
            setIssueDate(new Date().toISOString().split('T')[0]);
            // Default due date +30 days
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            setDueDate(nextMonth.toISOString().split('T')[0]);
            setNotes("");
            setItems([{ id: '1', description: '', qty: 1, unitPrice: 0 }]);
        }
    }, [isModalOpen]);

    // Item Management
    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), description: '', qty: 1, unitPrice: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    // Calculations
    const subtotal = items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
    const taxRate = 0.16; // 16% Tax as per screenshot example (approx)
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const handleSubmit = (status: 'Draft' | 'Sent') => {
        const selectedCustomer = customers.find(c => c.id === customerId);
        if (!selectedCustomer) {
            addToast('error', 'Please select a customer');
            return;
        }

        if (items.some(i => !i.description || i.qty <= 0 || i.unitPrice < 0)) {
            addToast('error', 'Please complete all line items correctly');
            return;
        }

        const newInvoice = {
            customerId: selectedCustomer.id,
            customer: {
                id: selectedCustomer.id,
                name: selectedCustomer.name,
                email: selectedCustomer.email
            },
            issueDate: new Date(issueDate).toLocaleDateString('en-US'),
            dueDate: new Date(dueDate).toLocaleDateString('en-US'),
            amount: total,
            status: status,
            items: items.map(i => ({
                description: i.description,
                qty: i.qty,
                unitPrice: i.unitPrice,
                amount: i.qty * i.unitPrice
            }))
        };

        addInvoice(newInvoice);
        addToast('success', `Invoice ${status === 'Draft' ? 'saved as draft' : 'created and sent'} successfully`);
        onClose();
    };

    return (
        <Modal
            title="New Invoice"
            description="Create a new invoice for your customer"
            isOpen={isModalOpen}
            onClose={onClose}
            maxWidth="max-w-5xl"
        >
            <div className="space-y-8">
                {/* Header with Logo */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                    <div>
                        {business.logo ? (
                            <div className="relative h-16 w-32 mb-2">
                                <Image src={business.logo} alt="Company Logo" fill className="object-contain" unoptimized />
                            </div>
                        ) : (
                            <h2 className="text-2xl font-bold text-slate-900">{business.name || 'Company Name'}</h2>
                        )}
                        <div className="text-sm text-slate-500 space-y-0.5">
                            {business.address && <p>{business.address}</p>}
                            {business.email && <p>{business.email}</p>}
                            {business.phone && <p>{business.phone}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight text-slate-200">INVOICE</h1>
                    </div>
                </div>

                {/* Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer <span className="text-red-500">*</span></label>
                        <select
                            required
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        >
                            <option value="">Select a customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Issue Date</label>
                            <input
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Line Items <span className="text-red-500">*</span></label>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                        >
                            <Plus size={14} />
                            Add Item
                        </button>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3 w-[45%]">Description</th>
                                    <th className="px-4 py-3 w-[15%]">Qty</th>
                                    <th className="px-4 py-3 w-[20%]">Unit Price</th>
                                    <th className="px-4 py-3 w-[15%]">Amount</th>
                                    <th className="px-4 py-3 w-[5%]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-slate-50/30">
                                {items.map((item) => (
                                    <tr key={item.id} className="group">
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                placeholder="Item description"
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 transition-shadow"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.qty}
                                                onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice || ''}
                                                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 transition-shadow"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700">
                                            ${(item.qty * item.unitPrice).toFixed(2)}
                                        </td>
                                        <td className="px-2 py-3 text-center">
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer and Totals */}
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes or payment terms..."
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm placeholder:text-slate-300"
                        />
                    </div>
                    <div className="w-full md:w-80 space-y-3 pt-4">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Tax (16%)</span>
                            <span className="font-medium">${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-3 mt-2">
                            <span>Total:</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('Draft')}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm"
                    >
                        Save as Draft
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('Sent')}
                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                    >
                        Create & Send
                    </button>
                </div>
            </div>
        </Modal>
    )
}
