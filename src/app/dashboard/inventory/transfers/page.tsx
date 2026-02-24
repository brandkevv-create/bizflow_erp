"use client";

import { useEffect, useState } from "react";
import { useTransfersStore, StockTransfer } from "@/store/transfers-store";
import { format } from "date-fns";
import { PackageSearch, Plus, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import { useInventoryStore } from "@/store/inventory-store";

const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    in_transit: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-700"
};

const statusLabels = {
    pending: "Draft",
    in_transit: "Shipped",
    completed: "Received",
    cancelled: "Cancelled"
};

export default function TransfersPage() {
    const { transfers, fetchTransfers, isLoading, updateTransferStatus } = useTransfersStore();
    const { locations, fetchLocations } = useInventoryStore();

    useEffect(() => {
        fetchTransfers();
        fetchLocations();
    }, [fetchTransfers, fetchLocations]);

    const getLocationName = (id: string) => {
        return locations.find(l => l.id === id)?.name || "Unknown Location";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ArrowRightLeft className="text-blue-600" size={24} />
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Transfers</h1>
                    </div>
                    <p className="text-slate-500">Manage inventory movement between your locations</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        //@ts-ignore - Will implement modal next
                        onClick={() => useModal.getState().onOpen("NEW_TRANSFER")}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Transfer
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading transfers...</div>
                ) : transfers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <ArrowRightLeft className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No transfers yet</h3>
                        <p className="max-w-sm mb-6">Move stock between your warehouses and retail locations to balance inventory.</p>
                        <button
                            //@ts-ignore 
                            onClick={() => useModal.getState().onOpen("NEW_TRANSFER")}
                            className="text-blue-600 font-medium hover:text-blue-700"
                        >
                            Create your first transfer
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Transfer Ref</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">From</th>
                                    <th className="px-6 py-4">To</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transfers.map((transfer) => (
                                    <tr key={transfer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900">{transfer.reference_number}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {format(new Date(transfer.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getLocationName(transfer.source_location_id)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getLocationName(transfer.destination_location_id)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <PackageSearch size={16} />
                                                <span>{transfer.items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0} units</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[transfer.status]}`}>
                                                {statusLabels[transfer.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {transfer.status === "pending" && (
                                                <button
                                                    onClick={() => updateTransferStatus(transfer.id, "in_transit")}
                                                    className="text-sm text-blue-600 font-medium hover:text-blue-800"
                                                >
                                                    Mark Shipped
                                                </button>
                                            )}
                                            {transfer.status === "in_transit" && (
                                                <button
                                                    onClick={() => updateTransferStatus(transfer.id, "completed")}
                                                    className="text-sm text-emerald-600 font-medium hover:text-emerald-800 flex items-center justify-end gap-1 ml-auto"
                                                >
                                                    <CheckCircle2 size={16} />
                                                    Receive
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
