"use client";

import { useEffect } from "react";
import { useAuditsStore } from "@/store/audits-store";
import { useModal } from "@/hooks/use-modal-store";
import { Plus, ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useInventoryStore } from "@/store/inventory-store";

export default function AuditsPage() {
    const { adjustments, fetchAdjustments, isLoading } = useAuditsStore();
    const { locations, fetchLocations } = useInventoryStore();
    const { onOpen } = useModal();

    useEffect(() => {
        fetchAdjustments();
        fetchLocations();
    }, [fetchAdjustments, fetchLocations]);

    const getLocationName = (id: string) => {
        return locations.find(l => l.id === id)?.name || "Unknown Location";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/inventory" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Takes & Audits</h1>
                    </div>
                    <p className="text-slate-500">Record physical counts and adjust inventory discrepancies.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onOpen("STOCK_ADJUSTMENT")}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Stock Take
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Audit ID</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Location</th>
                                <th className="px-6 py-4 font-medium">Reason</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Items Counted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading && adjustments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : adjustments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        <div className="text-base font-medium text-slate-900">No Audits Found</div>
                                        <div className="text-sm mt-1">Record physical inventory counts to maintain accuracy.</div>
                                    </td>
                                </tr>
                            ) : (
                                adjustments.map((audit) => (
                                    <tr key={audit.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-900">
                                            {audit.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {format(new Date(audit.created_at), 'MMM d, yyyy h:mm a')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{getLocationName(audit.location_id)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize">{audit.reason.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                                ${audit.status === 'posted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}
                                            `}>
                                                {audit.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {audit.items?.length || 0} product(s)
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
