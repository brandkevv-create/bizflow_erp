"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useInventoryStore } from "@/store/inventory-store";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, X, Tag } from "lucide-react";

export const ManageCategoriesModal = () => {
    const { isOpen, onClose, type } = useModal();
    const { categories, addCategory, removeCategory } = useInventoryStore(); // Assuming these exist in inventory store now
    const { addToast } = useToast();
    const [newCategory, setNewCategory] = useState("");

    const isModalOpen = isOpen && type === "MANAGE_CATEGORIES";

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        if (categories.includes(newCategory.trim())) {
            addToast('error', 'Category already exists');
            return;
        }

        addCategory(newCategory.trim());
        setNewCategory("");
        addToast('success', 'Category added');
    };

    return (
        <Modal
            title="Manage Categories"
            description="Add or view product categories."
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <div className="space-y-6">
                {/* Add New */}
                <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="New category name..."
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newCategory.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                </form>

                {/* List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Existing Categories</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <div key={cat} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-full group hover:border-red-200 transition-colors">
                                <Tag size={12} className="text-slate-400 group-hover:text-red-400" />
                                <span className="text-sm text-slate-700">{cat}</span>
                                <button
                                    onClick={() => removeCategory(cat)}
                                    className="p-1 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};
