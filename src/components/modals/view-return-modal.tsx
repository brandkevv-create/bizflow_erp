"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useReturnsStore, ReturnStatus } from "@/store/returns-store";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const ViewReturnModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { updateReturnStatus } = useReturnsStore();
    const { addToast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    const isModalOpen = isOpen && type === "VIEW_RETURN";
    const ret = data;

    if (!isModalOpen || !ret || typeof ret.refund_amount === 'undefined') return null;

    const handleUpdateStatus = async (status: ReturnStatus) => {
        setIsUpdating(true);
        try {
            await updateReturnStatus(ret.id, status);
            addToast('success', `Return marked as ${status}.`);
            onClose();
        } catch (error) {
            addToast('error', 'Failed to update return status');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Modal
            title="Return Details"
            description={`Details for RMA ${ret.reference_number}`}
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500 mb-1">Status</p>
                        <p className="font-medium capitalize">{ret.status}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Date</p>
                        <p className="font-medium">{ret.created_at}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Customer</p>
                        <p className="font-medium">{ret.customer_name}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 mb-1">Order ID</p>
                        <p className="font-medium">{ret.order_display_id}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-slate-500 mb-1">Reason</p>
                        <p className="font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">{ret.reason}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-slate-500 mb-1">Refund Amount</p>
                        <p className="font-bold text-lg text-slate-900">${ret.refund_amount.toFixed(2)}</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Returned Items</h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 font-medium text-slate-500">Item</th>
                                    <th className="px-4 py-2 font-medium text-slate-500 text-center">Qty</th>
                                    <th className="px-4 py-2 font-medium text-slate-500 text-center">Restocked</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ret.items?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3">{item.product_name}</td>
                                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                                        <td className="px-4 py-3 text-center">
                                            {item.restock ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Yes</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">No</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">
                        Close
                    </button>
                    {ret.status === 'pending' && (
                        <>
                            <button
                                onClick={() => handleUpdateStatus('rejected')}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('refunded')}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUpdating && <Loader2 size={16} className="animate-spin" />}
                                Approve & Refund
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};
