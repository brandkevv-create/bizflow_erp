"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useExpensesStore } from "@/store/expenses-store";
import { useToast } from "@/hooks/use-toast";

export const AddExpenseModal = () => {
    const { isOpen, onClose, type } = useModal();
    const { addToast } = useToast();
    const { categories, addExpense, fetchCategories } = useExpensesStore();

    const isModalOpen = isOpen && type === "ADD_EXPENSE";

    const [categoryId, setCategoryId] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [vendor, setVendor] = useState("");
    const [status, setStatus] = useState<'pending' | 'paid' | 'cancelled'>('paid');
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isModalOpen) {
            fetchCategories();
            setAmount("");
            setVendor("");
            setNotes("");
            setStatus('paid');
            setExpenseDate(new Date().toISOString().split('T')[0]);
            if (categories.length > 0 && !categoryId) {
                setCategoryId(categories[0].id);
            }
        }
    }, [isModalOpen, fetchCategories, categories, categoryId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId) {
            addToast('error', 'Please select a category');
            return;
        }

        try {
            setIsSubmitting(true);
            await addExpense({
                category_id: categoryId,
                amount: parseFloat(amount),
                currency,
                expense_date: expenseDate,
                vendor,
                status,
                notes,
            });
            addToast('success', 'Expense recorded successfully');
            onClose();
        } catch (error: any) {
            addToast('error', error.message || 'Failed to record expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title="Record New Expense"
            description="Log an operational business expense."
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <select
                            required
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled>Select category</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Date</label>
                        <input
                            type="date"
                            required
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select
                            value={status}
                            onChange={(e: any) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Vendor / Payee</label>
                    <input
                        type="text"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Office Depot, AWS, Landlord"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Additional details about this expense..."
                        rows={3}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Recording...' : 'Record Expense'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
