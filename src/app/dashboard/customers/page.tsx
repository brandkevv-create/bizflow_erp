"use client";

import { useState, useEffect } from "react";
import { useCustomersStore } from "@/store/customers-store";
import { useModal } from "@/hooks/use-modal-store";
import { DollarSign, Download, Plus, Search, Users, Wallet } from "lucide-react";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { exportToCSV } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export default function CustomersPage() {
    const { customers, stats, deleteCustomer, fetchCustomers } = useCustomersStore();
    const formatCurrency = useFormatCurrency();
    const { onOpen } = useModal();
    const { addToast } = useToast();
    const { showDialog } = useConfirmDialog();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Filter customers by search
    const filteredCustomers = customers.filter(customer =>
        searchTerm === "" ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

    const toggleSelectAll = () => {
        if (selectedCustomerIds.length === filteredCustomers.length) {
            setSelectedCustomerIds([]);
        } else {
            setSelectedCustomerIds(filteredCustomers.map(c => c.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        if (selectedCustomerIds.includes(id)) {
            setSelectedCustomerIds(selectedCustomerIds.filter(cid => cid !== id));
        } else {
            setSelectedCustomerIds([...selectedCustomerIds, id]);
        }
    };

    const handleExport = () => {
        const dataToExport = selectedCustomerIds.length > 0
            ? filteredCustomers.filter(c => selectedCustomerIds.includes(c.id))
            : filteredCustomers;

        exportToCSV(dataToExport, 'customers');
        if (selectedCustomerIds.length > 0) {
            addToast('success', `Exported ${selectedCustomerIds.length} selected customers`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customers</h1>
                    <p className="text-slate-500">Manage customer information and purchase history</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Download size={18} />
                        {selectedCustomerIds.length > 0 ? `Export Selected (${selectedCustomerIds.length})` : 'Export'}
                    </button>
                    <button
                        onClick={() => onOpen("ADD_CUSTOMER")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Add Customer
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Customers</p>
                        <h3 className="text-2xl font-bold mt-2 text-slate-900">{stats.total}</h3>
                        <p className="text-sm text-green-600 mt-1">+{stats.active} active</p>
                    </div>
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                        <Users size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Average Order Value</p>
                        <h3 className="text-2xl font-bold mt-2 text-slate-900">{formatCurrency(stats.avgOrderValue)}</h3>
                    </div>
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <DollarSign size={20} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Lifetime Value</p>
                        <h3 className="text-2xl font-bold mt-2 text-slate-900">{formatCurrency(stats.lifetimeValue)}</h3>
                    </div>
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Wallet size={20} />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-4">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Contact</th>
                                <th className="px-6 py-3">Orders</th>
                                <th className="px-6 py-3">Total Spent</th>
                                <th className="px-6 py-3">Last Order</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className={`hover:bg-slate-50 transition-colors ${selectedCustomerIds.includes(customer.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedCustomerIds.includes(customer.id)}
                                            onChange={() => toggleSelectOne(customer.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {customer.initials}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{customer.name}</p>
                                                <p className="text-xs text-slate-500">Joined {customer.joinedDate}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-slate-500">
                                            <span className="flex items-center gap-1.5 text-xs">✉ {customer.email}</span>
                                            <span className="flex items-center gap-1.5 text-xs mt-0.5">📞 {customer.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">{customer.ordersCount}</td>
                                    <td className="px-6 py-4 text-slate-900 font-bold">{formatCurrency(customer.totalSpent)}</td>
                                    <td className="px-6 py-4 text-slate-500">{customer.lastOrderDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${customer.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            onEdit={() => onOpen("EDIT_CUSTOMER", customer)}
                                            onSendEmail={() => onOpen("VIEW_CUSTOMER", customer)}
                                            onDelete={() => {
                                                showDialog({
                                                    title: 'Delete Customer',
                                                    message: `Are you sure you want to delete "${customer.name}"? All associated data will be permanently removed.`,
                                                    confirmText: 'Delete',
                                                    type: 'danger',
                                                    onConfirm: () => {
                                                        deleteCustomer(customer.id);
                                                        addToast('success', 'Customer deleted successfully');
                                                    }
                                                });
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
