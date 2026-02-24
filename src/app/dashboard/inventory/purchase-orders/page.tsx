"use client";

import { useEffect } from "react";
import { usePurchaseOrdersStore } from "@/store/purchase-orders-store";
import { useModal } from "@/hooks/use-modal-store";
import { Plus, ArrowLeft, ClipboardList, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function PurchaseOrdersPage() {
    const { purchaseOrders, fetchPurchaseOrders, isLoading } = usePurchaseOrdersStore();
    const { onOpen } = useModal();

    useEffect(() => {
        fetchPurchaseOrders();
    }, [fetchPurchaseOrders]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/inventory" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Orders</h1>
                    </div>
                    <p className="text-slate-500">Manage vendor orders, track shipments, and receive inventory.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onOpen("ADD_PURCHASE_ORDER")}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create PO
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">PO Number</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Supplier</th>
                                <th className="px-6 py-4 font-medium">Destination</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                                <th className="px-6 py-4 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading && purchaseOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : purchaseOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        <div className="text-base font-medium text-slate-900">No Purchase Orders</div>
                                        <div className="text-sm mt-1">Create a new purchase order to restock inventory from your vendors.</div>
                                    </td>
                                </tr>
                            ) : (
                                purchaseOrders.map((po) => (
                                    <tr key={po.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => onOpen("VIEW_PURCHASE_ORDER", po)}>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-900">
                                            {po.po_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(po.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{po.supplier?.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-900">{po.location?.name}</div>
                                            <div className="text-xs text-slate-500">{po.location?.type}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                                ${po.status === 'received' ? 'bg-emerald-100 text-emerald-700' : ''}
                                                ${po.status === 'ordered' ? 'bg-blue-100 text-blue-700' : ''}
                                                ${po.status === 'draft' ? 'bg-slate-100 text-slate-700' : ''}
                                                ${po.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                                            `}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            ${po.total_amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
