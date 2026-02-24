"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useInventoryStore } from "@/store/inventory-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowDown, ArrowUp } from "lucide-react";

export const StockAdjustmentModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { adjustStock } = useInventoryStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "STOCK_ADJUSTMENT";
    const product = data;

    // Form state
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
    const [quantity, setQuantity] = useState("1");
    const [reason, setReason] = useState("Restock");
    const [notes, setNotes] = useState("");

    // Reset form when modal opens
    useEffect(() => {
        if (isModalOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAdjustmentType('add');
            setQuantity("1");
            setReason("Restock");
            setNotes("");
        }
    }, [isModalOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!product) return;

        const qty = parseInt(quantity);
        if (qty <= 0) {
            addToast('error', 'Quantity must be greater than 0');
            return;
        }

        adjustStock(product.id, {
            type: adjustmentType,
            quantity: qty,
            reason,
            notes
        });

        addToast('success', `Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully`);
        onClose();
    };

    const reasons = adjustmentType === 'add'
        ? ['Restock', 'Return', 'Correction', 'Other']
        : ['Sold', 'Damaged', 'Theft', 'Expired', 'Correction', 'Other'];

    if (!product) return null;

    return (
        <Modal
            title="Adjust Stock"
            description={`Update inventory for ${product.name} (Current: ${product.stock})`}
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            setAdjustmentType('add');
                            setReason('Restock');
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${adjustmentType === 'add'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                            }`}
                    >
                        <ArrowUp size={24} className="mb-2" />
                        <span className="font-medium">Add Stock</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setAdjustmentType('remove');
                            setReason('Sold');
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${adjustmentType === 'remove'
                            ? 'border-orange-600 bg-orange-50 text-orange-700'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                            }`}
                    >
                        <ArrowDown size={24} className="mb-2" />
                        <span className="font-medium">Remove Stock</span>
                    </button>
                </div>

                {/* Main Inputs */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {reasons.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                            placeholder="Add any additional details..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={`px-4 py-2 text-white font-medium rounded-lg transition-colors shadow-sm ${adjustmentType === 'add' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                    >
                        Confirm {adjustmentType === 'add' ? 'Addition' : 'Removal'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
