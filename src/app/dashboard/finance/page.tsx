"use client";

import { useState, useEffect } from "react";
import { useFinanceStore } from "@/store/finance-store";
import { useModal } from "@/hooks/use-modal-store";
import { CreditCard, DollarSign, Download, Eye, Filter, Pencil, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { exportToCSV } from "@/lib/export";
import { StatusDropdown } from "@/components/ui/status-dropdown";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { useExpensesStore } from "@/store/expenses-store";

export default function FinancePage() {
    const { invoices, invoiceStats, payments, paymentStats, deleteInvoice, updateInvoice, fetchInvoices, fetchPayments } = useFinanceStore();
    const { expenses, categories, fetchExpenses, fetchCategories, deleteExpense, updateExpenseStatus } = useExpensesStore();
    const formatCurrency = useFormatCurrency();
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
    const { onOpen } = useModal();

    useEffect(() => {
        fetchInvoices();
        fetchPayments();
        fetchExpenses();
        fetchCategories();
    }, [fetchInvoices, fetchPayments, fetchExpenses, fetchCategories]);
    const { addToast } = useToast();
    const { showDialog } = useConfirmDialog();

    // Search and filter state
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [paymentSearch, setPaymentSearch] = useState("");
    const [expenseSearch, setExpenseSearch] = useState("");
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
    const [expenseStatusFilter, setExpenseStatusFilter] = useState("all");
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");

    // Selection State
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

    // Filter invoices
    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoiceSearch === "" ||
            invoice.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
            invoice.customer.name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
            invoice.customer.email.toLowerCase().includes(invoiceSearch.toLowerCase());

        const matchesStatus = invoiceStatusFilter === "all" || invoice.status === invoiceStatusFilter;
        return matchesSearch && matchesStatus;
    });

    // Filter payments
    const filteredPayments = payments.filter(payment => {
        const matchesSearch = paymentSearch === "" ||
            payment.id.toLowerCase().includes(paymentSearch.toLowerCase()) ||
            (payment.invoiceId || '').toLowerCase().includes(paymentSearch.toLowerCase()) ||
            (payment.customer || '').toLowerCase().includes(paymentSearch.toLowerCase());

        const matchesStatus = paymentStatusFilter === "all" || payment.status === paymentStatusFilter;
        const matchesMethod = paymentMethodFilter === "all" || payment.method === paymentMethodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
    });

    // Filter expenses
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expenseSearch === "" ||
            expense.reference_number.toLowerCase().includes(expenseSearch.toLowerCase()) ||
            (expense.vendor || '').toLowerCase().includes(expenseSearch.toLowerCase());

        const matchesStatus = expenseStatusFilter === "all" || expense.status === expenseStatusFilter;
        const matchesCategory = expenseCategoryFilter === "all" || expense.category_id === expenseCategoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    // Selection Handlers (Invoices)
    const toggleSelectAll = () => {
        if (selectedInvoiceIds.length === filteredInvoices.length) {
            setSelectedInvoiceIds([]);
        } else {
            setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        if (selectedInvoiceIds.includes(id)) {
            setSelectedInvoiceIds(selectedInvoiceIds.filter(i => i !== id));
        } else {
            setSelectedInvoiceIds([...selectedInvoiceIds, id]);
        }
    };

    const handleExportInvoices = () => {
        const dataToExport = selectedInvoiceIds.length > 0
            ? filteredInvoices.filter(i => selectedInvoiceIds.includes(i.id))
            : filteredInvoices;

        exportToCSV(dataToExport, 'invoices');
        if (selectedInvoiceIds.length > 0) {
            addToast('success', `Exported ${selectedInvoiceIds.length} selected invoices`);
        }
    };

    const paymentMethods = Array.from(new Set(payments.map(p => p.method)));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        {activeTab === 'invoices' && 'Invoices'}
                        {activeTab === 'payments' && 'Payments'}
                        {activeTab === 'expenses' && 'Expenses'}
                    </h1>
                    <p className="text-slate-500">
                        {activeTab === 'invoices' && 'Manage and track all your invoices'}
                        {activeTab === 'payments' && 'Track and manage all payment transactions'}
                        {activeTab === 'expenses' && 'Track and manage your operational expenses'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab === 'expenses' && (
                        <>
                            <button
                                onClick={() => onOpen("MANAGE_EXPENSE_CATEGORIES")}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Categories
                            </button>
                            <button
                                onClick={() => onOpen("ADD_EXPENSE")}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={18} />
                                Record Expense
                            </button>
                        </>
                    )}
                    {activeTab === 'payments' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onOpen("ADD_PAYMENT")}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={18} />
                                Record Payment
                            </button>
                        </div>
                    )}
                    {activeTab === 'invoices' && (
                        <>
                            <button
                                onClick={handleExportInvoices}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <Download size={18} />
                                {selectedInvoiceIds.length > 0 ? `Export Selected (${selectedInvoiceIds.length})` : 'Export'}
                            </button>
                            <button
                                onClick={() => onOpen("ADD_INVOICE")}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={18} />
                                New Invoice
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Visual Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Invoices
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'payments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Payments
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'expenses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Expenses
                </button>
            </div>

            {activeTab === 'invoices' && (
                /* INVOICES CONTENT */
                <div className="space-y-6">
                    {/* Status Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatusCard label="Total Invoiced" value={invoiceStats.invoiced} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
                        <StatusCard label="Paid" value={invoiceStats.paid} icon={DollarSign} color="text-green-600" bg="bg-green-50" />
                        <StatusCard label="Pending" value={invoiceStats.pending} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
                        <StatusCard label="Overdue" value={invoiceStats.overdue} icon={DollarSign} color="text-red-600" bg="bg-red-50" />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by invoice number or customer..."
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <select
                                value={invoiceStatusFilter}
                                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                                className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Paid">Paid</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 w-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedInvoiceIds.length === filteredInvoices.length && filteredInvoices.length > 0}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="px-6 py-3">Invoice #</th>
                                        <th className="px-6 py-3">Customer</th>
                                        <th className="px-6 py-3">Issue Date</th>
                                        <th className="px-6 py-3">Due Date</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Paid</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id} className={`hover:bg-slate-50 transition-colors ${selectedInvoiceIds.includes(invoice.id) ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedInvoiceIds.includes(invoice.id)}
                                                    onChange={() => toggleSelectOne(invoice.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">{invoice.invoiceNumber}</td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-900">{invoice.customer.name}</p>
                                                <p className="text-xs text-slate-500">{invoice.customer.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{invoice.issueDate}</td>
                                            <td className="px-6 py-4 text-slate-500">{invoice.dueDate}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(invoice.amount)}</td>
                                            <td className={`px-6 py-4 font-medium ${invoice.paidAmount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                                {formatCurrency(invoice.paidAmount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusDropdown
                                                    currentStatus={invoice.status}
                                                    options={[
                                                        { value: 'Draft', label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                                                        { value: 'Sent', label: 'Sent', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                                        { value: 'Paid', label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200' },
                                                        { value: 'Overdue', label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' },
                                                        { value: 'Cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                                                    ]}
                                                    onSelect={(status) => updateInvoice(invoice.id, { status: status as any })}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-slate-400">
                                                    <button
                                                        onClick={() => onOpen("VIEW_INVOICE", invoice)}
                                                        className="p-1 hover:bg-slate-100 rounded hover:text-blue-600 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onOpen("EDIT_INVOICE", invoice)}
                                                        className="p-1 hover:bg-slate-100 rounded hover:text-blue-600 transition-colors"
                                                        title="Edit Invoice"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            showDialog({
                                                                title: 'Delete Invoice',
                                                                message: `Are you sure you want to delete invoice ${invoice.id}? This action cannot be undone.`,
                                                                confirmText: 'Delete',
                                                                type: 'danger',
                                                                onConfirm: () => {
                                                                    deleteInvoice(invoice.id);
                                                                    addToast('success', 'Invoice deleted successfully');
                                                                }
                                                            });
                                                        }}
                                                        className="p-1 hover:bg-slate-100 rounded hover:text-red-600 transition-colors"
                                                        title="Delete Invoice"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                /* PAYMENTS CONTENT */
                /* PAYMENTS CONTENT */
                <div className="space-y-6">
                    {/* Payment Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatusCard label="Total Received" value={paymentStats.received} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
                        <StatusCard label="Completed" value={paymentStats.completed} icon={CreditCard} color="text-green-600" bg="bg-green-50" />
                        <StatusCard label="Pending" value={paymentStats.pending} icon={CreditCard} color="text-yellow-600" bg="bg-yellow-50" />
                        <StatusCard label="This Month" value={paymentStats.thisMonth} icon={TrendingUp} color="text-blue-600" bg="bg-blue-50" />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative flex-1 w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by payment number, invoice, or customer..."
                                value={paymentSearch}
                                onChange={(e) => setPaymentSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative group">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-700 pointer-events-none" size={16} />
                                <select
                                    value={paymentMethodFilter}
                                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer transition-colors shadow-sm"
                                >
                                    <option value="all">All Methods</option>
                                    {paymentMethods.map(method => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative group">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-700 pointer-events-none" size={16} />
                                <select
                                    value={paymentStatusFilter}
                                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer transition-colors shadow-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Failed">Failed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Payments Table */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Payment #</th>
                                        <th className="px-6 py-4">Invoice #</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Method</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-900">{payment.id}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        const invoice = invoices.find(i => i.id === payment.invoiceId);
                                                        if (invoice) onOpen("VIEW_INVOICE", invoice);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                                >
                                                    {payment.invoiceNumber || 'N/A'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{payment.customer}</td>
                                            <td className="px-6 py-4 text-slate-500">{payment.date}</td>
                                            <td className="px-6 py-4 text-slate-700">{payment.method}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(payment.amount)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(payment.status)}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-slate-400">
                                                    <button
                                                        onClick={() => onOpen("VIEW_PAYMENT", payment)}
                                                        className="p-1.5 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors"
                                                        title="Download Receipt"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'expenses' && (
                /* EXPENSES CONTENT */
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative flex-1 w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search expenses by reference or vendor..."
                                value={expenseSearch}
                                onChange={(e) => setExpenseSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative group">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-700 pointer-events-none" size={16} />
                                <select
                                    value={expenseCategoryFilter}
                                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer transition-colors shadow-sm"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative group">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-slate-700 pointer-events-none" size={16} />
                                <select
                                    value={expenseStatusFilter}
                                    onChange={(e) => setExpenseStatusFilter(e.target.value)}
                                    className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer transition-colors shadow-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Table */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4">Ref #</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Vendor</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredExpenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-900">{expense.reference_number}</td>
                                            <td className="px-6 py-4 text-slate-500">{new Date(expense.expense_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-slate-700">{expense.category_name}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{expense.vendor || '-'}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(expense.amount)}</td>
                                            <td className="px-6 py-4">
                                                <StatusDropdown
                                                    currentStatus={expense.status}
                                                    options={[
                                                        { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200' },
                                                        { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                                                        { value: 'cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                                                    ]}
                                                    onSelect={(status) => updateExpenseStatus(expense.id, status as any)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-slate-400">
                                                    <button
                                                        onClick={() => {
                                                            showDialog({
                                                                title: 'Delete Expense',
                                                                message: 'Are you sure you want to delete this expense record?',
                                                                confirmText: 'Delete',
                                                                type: 'danger',
                                                                onConfirm: async () => {
                                                                    try {
                                                                        await deleteExpense(expense.id);
                                                                        addToast('success', 'Expense deleted');
                                                                    } catch (e: any) {
                                                                        addToast('error', e.message || 'Failed to delete');
                                                                    }
                                                                }
                                                            });
                                                        }}
                                                        className="p-1.5 hover:bg-slate-100 rounded-full hover:text-red-600 transition-colors"
                                                        title="Delete Expense"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                                No expenses found matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatusCard({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
                <h3 className={`text-2xl font-bold ${color === 'text-red-600' ? 'text-red-600' : 'text-slate-900'}`}>
                    {new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' }).format(value).replace('$', '').replace('US', '') /* Replace this hack soon */}
                </h3>
            </div>
            <div className={`p-3 rounded-full ${bg} ${color}`}>
                <Icon size={20} />
            </div>
        </div>
    )
}

function getInvoiceStatusColor(status: string) {
    switch (status) {
        case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
        case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
        case 'Draft': return 'bg-slate-100 text-slate-600 border-slate-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
}

function getPaymentStatusColor(status: string) {
    switch (status) {
        case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
        case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
}
