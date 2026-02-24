"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useExpensesStore } from "@/store/expenses-store";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

export const ManageExpenseCategoriesModal = () => {
    const { isOpen, onClose, type } = useModal();
    const { addToast } = useToast();
    const { categories, fetchCategories, addCategory, deleteCategory } = useExpensesStore();

    const isModalOpen = isOpen && type === "MANAGE_EXPENSE_CATEGORIES";

    const [newCategoryName, setNewCategoryName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isModalOpen) {
            fetchCategories();
            setNewCategoryName("");
        }
    }, [isModalOpen, fetchCategories]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        try {
            setIsSubmitting(true);
            await addCategory({ name: newCategoryName.trim() });
            setNewCategoryName("");
            addToast('success', 'Category added');
        } catch (error: any) {
            addToast('error', error.message || 'Failed to add category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            addToast('success', 'Category deleted');
        } catch (error: any) {
            addToast('error', error.message || 'Failed to delete category');
        }
    };

    return (
        <Modal
            title="Manage Expense Categories"
            description="Add or remove categories for classifying business expenses."
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <div className="space-y-6">
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                        type="text"
                        required
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="New category name..."
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newCategoryName.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Add
                    </button>
                </form>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-medium text-sm text-slate-600">
                        Existing Categories
                    </div>
                    <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {categories.length === 0 ? (
                            <li className="px-4 py-6 text-center text-sm text-slate-500">
                                No categories configured.
                            </li>
                        ) : (
                            categories.map(category => (
                                <li key={category.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 group">
                                    <span className="font-medium text-slate-900">{category.name}</span>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete Category"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 rounded-lg"
                    >
                        Done
                    </button>
                </div>
            </div>
        </Modal>
    );
};
