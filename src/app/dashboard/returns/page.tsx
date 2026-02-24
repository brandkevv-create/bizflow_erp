"use client";

import { useEffect, useState } from "react";
import { useReturnsStore, ReturnStatus } from "@/store/returns-store";
import { Search, Filter, ArrowUpDown, Eye } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";

export default function ReturnsPage() {
    const { returns, isLoading, fetchReturns } = useReturnsStore();
    const { onOpen } = useModal();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'all'>('all');

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const filteredReturns = returns.filter(ret => {
        const matchesSearch = ret.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.order_display_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ret.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: ReturnStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-blue-100 text-blue-800';
            case 'refunded': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Returns (RMA)</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage customer returns and refunds.</p>
                </div>
                {/* A button to initiate a manual return might go here, but usually it originates from an Order. */}
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by RMA, Order ID, or Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-slate-400" size={20} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ReturnStatus | 'all')}
                        className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="refunded">Refunded</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-medium text-slate-500 text-sm">
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                                        RMA # <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Order ID</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Date</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Customer</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Refund Amount</th>
                                <th className="p-4 font-medium text-slate-500 text-sm">Status</th>
                                <th className="p-4 font-medium text-slate-500 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            Loading returns...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReturns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500 flex flex-col items-center">
                                        <p className="font-medium text-slate-900 mb-1">No returns found</p>
                                        <p className="text-sm">We couldn't find any return requests matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredReturns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-medium text-slate-900">{ret.reference_number}</td>
                                        <td className="p-4 text-slate-500">{ret.order_display_id}</td>
                                        <td className="p-4 text-slate-500">{ret.created_at}</td>
                                        <td className="p-4 text-slate-900">{ret.customer_name}</td>
                                        <td className="p-4 text-slate-900 font-medium">${ret.refund_amount.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyle(ret.status)}`}>
                                                {ret.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => onOpen('VIEW_RETURN', ret)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
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
