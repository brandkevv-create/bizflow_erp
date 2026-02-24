"use client";

import { useState, useEffect } from "react";
import { useOrdersStore } from "@/store/orders-store";
import { CheckCircle, Clock, Download, Search, Truck, XCircle, RotateCcw } from "lucide-react";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { StatusDropdown } from "@/components/ui/status-dropdown";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useModal } from "@/hooks/use-modal-store";
import { exportToCSV } from "@/lib/export";

export default function OrdersPage() {
    const {
        orders,
        stats,
        deleteOrder,
        updateOrder,
        fetchOrders,
        searchQuery,
        setSearchQuery,
        selectedStatus,
        setSelectedStatus,
        currentPage,
        pageSize,
        totalOrders,
        setPage,
        isLoading
    } = useOrdersStore();
    const { addToast } = useToast();
    const { onOpen } = useModal();
    const { showDialog } = useConfirmDialog();
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const totalPages = Math.ceil(totalOrders / pageSize) || 1;

    const toggleSelectAll = () => {
        if (selectedOrderIds.length === orders.length && orders.length > 0) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(orders.map(o => o.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        if (selectedOrderIds.includes(id)) {
            setSelectedOrderIds(selectedOrderIds.filter(oid => oid !== id));
        } else {
            setSelectedOrderIds([...selectedOrderIds, id]);
        }
    };

    const handleExport = () => {
        const dataToExport = selectedOrderIds.length > 0
            ? orders.filter(o => selectedOrderIds.includes(o.id))
            : orders;

        exportToCSV(dataToExport, 'orders');
        if (selectedOrderIds.length > 0) {
            addToast('success', `Exported ${selectedOrderIds.length} selected orders`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales & Orders</h1>
                    <p className="text-slate-500">Track and manage all your customer orders</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <Download size={18} />
                    {selectedOrderIds.length > 0 ? `Export Selected (${selectedOrderIds.length})` : 'Export Orders'}
                </button>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard label="Pending" count={stats.pending} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
                <StatusCard label="Paid" count={stats.paid} icon={CheckCircle} color="text-blue-600" bg="bg-blue-50" />
                <StatusCard label="Fulfilled" count={stats.fulfilled} icon={Truck} color="text-green-600" bg="bg-green-50" />
                <StatusCard label="Cancelled" count={stats.cancelled} icon={XCircle} color="text-red-600" bg="bg-red-50" />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by order #, customer, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-4">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedOrderIds.length === orders.length && orders.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3">Order #</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Items</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Source</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-blue-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedOrderIds.includes(order.id)}
                                                onChange={() => toggleSelectOne(order.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">{order.displayId}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">{order.customer.name}</p>
                                            <p className="text-xs text-slate-500">{order.customer.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{order.itemsCount} items</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">${order.total?.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <StatusDropdown
                                                currentStatus={order.status}
                                                options={[
                                                    { value: 'Pending', label: 'Pending', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                                                    { value: 'Paid', label: 'Paid', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                                    { value: 'Fulfilled', label: 'Fulfilled', color: 'bg-green-50 text-green-700 border-green-200' },
                                                    { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
                                                ]}
                                                onSelect={(status) => updateOrder(order.id, { status: status as any })}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                                {order.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{order.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionDropdown
                                                onCustomAction={() => onOpen('PROCESS_RETURN', order)}
                                                customActionLabel="Process Return"
                                                customActionIcon={RotateCcw}
                                                onDelete={() => {
                                                    showDialog({
                                                        title: 'Delete Order',
                                                        message: `Are you sure you want to delete order ${order.id}? This action cannot be undone.`,
                                                        confirmText: 'Delete',
                                                        type: 'danger',
                                                        onConfirm: () => {
                                                            deleteOrder(order.id);
                                                            addToast('success', 'Order deleted successfully');
                                                        }
                                                    });
                                                }}
                                            />
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => setPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1 || isLoading}
                                className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages || isLoading}
                                className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalOrders)}</span> of{' '}
                                    <span className="font-medium">{totalOrders}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1 || isLoading}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5) {
                                            if (currentPage > 3) {
                                                pageNum = currentPage - 2 + i;
                                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                            }
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                disabled={isLoading}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${currentPage === pageNum ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages || isLoading}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatusCard({ label, count, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-4">
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase">{label}</p>
                <h3 className="text-xl font-bold text-slate-900">{count}</h3>
            </div>
        </div>
    )
}

function getStatusStyles(status: string) {
    switch (status) {
        case 'Pending': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'Paid': return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Fulfilled': return 'bg-green-50 text-green-700 border-green-200';
        case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'Pending': return <Clock size={12} />;
        case 'Paid': return <CheckCircle size={12} />;
        case 'Fulfilled': return <Truck size={12} />;
        case 'Cancelled': return <XCircle size={12} />;
        default: return null;
    }
}
