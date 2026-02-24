"use client";

import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/use-modal-store";
import { useTransfersStore } from "@/store/transfers-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export const AddTransferModal = () => {
    const { isOpen, onClose, type } = useModal();
    const isModalOpen = isOpen && type === "ADD_TRANSFER";

    const { createTransfer, isLoading: isTransferring } = useTransfersStore();
    const { locations, products } = useInventoryStore();
    const { user } = useAuthStore();

    const [sourceLoc, setSourceLoc] = useState("");
    const [destLoc, setDestLoc] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<{ productId: string, quantity: number }[]>([]);

    useEffect(() => {
        if (isModalOpen) {
            setSourceLoc("");
            setDestLoc("");
            setNotes("");
            setItems([]);
        }
    }, [isModalOpen]);

    const handleAddItem = () => {
        setItems([...items, { productId: "", quantity: 1 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const getAvailableStock = (productId: string, locationId: string) => {
        if (!productId || !locationId) return 0;
        const product = products.find(p => p.id === productId);
        if (!product) return 0;
        // Need to fetch specific location stock if we store it, 
        // For now, if we don't have location specific stock easily accessible in products array, 
        // we might allow it and let the backend fail, or assume total stock.
        // In a real app we'd query inventory_levels for this specific location.
        return product.stock;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sourceLoc || !destLoc) return;
        if (sourceLoc === destLoc) {
            alert("Source and destination must be different");
            return;
        }
        if (items.length === 0 || items.some(i => !i.productId || i.quantity <= 0)) {
            alert("Please add valid items to transfer");
            return;
        }

        try {
            const transferData = {
                reference_number: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
                source_location_id: sourceLoc,
                destination_location_id: destLoc,
                notes,
            };

            const transferItems = items.map(i => ({
                product_id: i.productId,
                quantity: i.quantity
            }));

            await createTransfer(transferData, transferItems);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to create transfer");
        }
    };

    return (
        <Modal
            title="New Stock Transfer"
            description="Create a pending transfer to move stock between locations."
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Origin Location</label>
                        <select
                            required
                            value={sourceLoc}
                            onChange={(e) => setSourceLoc(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Select Origin...</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id} disabled={loc.id === destLoc}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Destination Location</label>
                        <select
                            required
                            value={destLoc}
                            onChange={(e) => setDestLoc(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Select Destination...</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id} disabled={loc.id === sourceLoc}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Items to Transfer</label>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <Plus size={14} /> Add Item
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                            No items added yet. Click &quot;Add Item&quot; to begin.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex-1 space-y-1">
                                        <select
                                            required
                                            value={item.productId}
                                            onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                        >
                                            <option value="">Select Product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                            ))}
                                        </select>
                                        {item.productId && sourceLoc && (
                                            <p className="text-xs text-slate-500 ml-1">
                                                Available total: {getAvailableStock(item.productId, sourceLoc)} units
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-32">
                                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                                                className="px-2 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                value={item.quantity || ''}
                                                onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                className="w-full py-2 text-center text-sm font-medium focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateItem(index, 'quantity', item.quantity + 1)}
                                                className="px-2 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Reason for transfer..."
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        disabled={isTransferring}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isTransferring || items.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isTransferring ? "Creating..." : "Create Transfer"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
