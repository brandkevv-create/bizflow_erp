"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useReturnsStore } from "@/store/returns-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const ProcessReturnModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { createReturn } = useReturnsStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "PROCESS_RETURN";
    const order = data; // The order object passed when opening

    const [reason, setReason] = useState("");
    const [refundAmount, setRefundAmount] = useState("");
    const [selectedItems, setSelectedItems] = useState<{ id: string, quantity: number, restock: boolean, product_name: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isModalOpen && order) {
            setReason("");
            setRefundAmount(order.total_amount?.toString() || "");
            // Pre-populate with all order items, default restock true, qty 0 (need to select how many to return)
            if (order.order_items) {
                const initialItems = order.order_items.map((item: any) => ({
                    id: item.id,
                    product_name: item.product_name,
                    quantity: 0,
                    max_quantity: item.quantity,
                    restock: true
                }));
                setSelectedItems(initialItems);
            }
        }
    }, [isModalOpen, order]);

    if (!isModalOpen || !order || !order.id) return null;

    const handleItemChange = (id: string, field: 'quantity' | 'restock', value: number | boolean) => {
        setSelectedItems(items => items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const itemsToReturn = selectedItems.filter(item => item.quantity > 0);

        if (itemsToReturn.length === 0) {
            addToast('error', 'Please select at least one item to return.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createReturn({
                order_id: order.id,
                customer_id: order.customer_id,
                reason,
                refund_amount: Number(refundAmount),
                items: itemsToReturn.map(item => ({
                    order_item_id: item.id,
                    quantity: item.quantity,
                    restock: item.restock
                }))
            });
            addToast('success', 'Return processed successfully');
            onClose();
        } catch (error) {
            addToast('error', 'Failed to process return');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title="Process Return (RMA)"
            description={`Create a return for Order ${order.id?.substring(0, 8).toUpperCase()}`}
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Reason for Return</label>
                    <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="e.g. Defective product, wrong size..."
                    />
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-900">Select Items to Return</h4>
                    <div className="space-y-2">
                        {selectedItems.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                                    <p className="text-xs text-slate-500">Ordered: {item.max_quantity}</p>
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Return Qty</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={item.max_quantity}
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-medium text-slate-500 block mb-1">Restock?</label>
                                    <div className="flex items-center h-[30px]">
                                        <input
                                            type="checkbox"
                                            checked={item.restock}
                                            onChange={(e) => handleItemChange(item.id, 'restock', e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-sm font-medium text-slate-700">Total Refund Amount ($)</label>
                    <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        Create Return
                    </button>
                </div>
            </form>
        </Modal>
    );
};
