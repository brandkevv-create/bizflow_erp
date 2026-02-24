"use client";

import { useState, useEffect } from "react";
import { useReportsStore } from "@/store/reports-store";
import { BarChart3, Box, Calendar, ChevronDown, DollarSign, Download, ShoppingCart, TrendingUp } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export default function ReportsPage() {
    const { kpis, charts, inventoryStats, fetchReportsData } = useReportsStore();
    const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'products'>('sales');
    const formatCurrency = useFormatCurrency();

    useEffect(() => {
        fetchReportsData();
    }, [fetchReportsData]);

    const handleExport = () => {
        import("@/lib/export").then(({ exportToCSV }) => {
            if (activeTab === 'sales') {
                exportToCSV(charts.trend, 'sales-trend-report');
            } else if (activeTab === 'inventory') {
                exportToCSV(charts.inventory, 'inventory-stats-report');
            } else if (activeTab === 'products') {
                // Not heavily populated in this view yet, but exporting top products is a good fallback
                exportToCSV(charts.categories, 'sales-categories-report');
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
                    <p className="text-slate-500">Analyze your business performance and trends</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium flex items-center gap-2 cursor-pointer hover:bg-slate-50">
                        <Calendar size={16} />
                        <span>Last 7 days</span>
                        <ChevronDown size={14} className="ml-1" />
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                    >
                        <Download size={16} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-6 border-b border-slate-200 pb-1">
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`flex items-center gap-2 px-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sales' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <DollarSign size={16} />
                    Sales
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-2 px-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'inventory' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <ShoppingCart size={16} />
                    Inventory
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-2 px-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'products' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingUp size={16} />
                    Products
                </button>
            </div>

            {activeTab === 'sales' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <KpiCard label="Total Revenue" value={formatCurrency(kpis.revenue.value)} change={kpis.revenue.change} />
                        <KpiCard label="Total Orders" value={kpis.orders.value.toLocaleString()} change={kpis.orders.change} />
                        <KpiCard label="Avg Order Value" value={formatCurrency(kpis.aov.value)} change={kpis.aov.change} />
                        <KpiCard label="Total Profit" value={formatCurrency(kpis.profit.value)} change={kpis.profit.change} />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Line Chart */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-1">Revenue & Profit Trend</h3>
                            <p className="text-sm text-slate-500 mb-6">Monthly performance over the last 7 months</p>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val: number) => formatCurrency(val)} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: '500' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-1">Sales by Category</h3>
                            <p className="text-sm text-slate-500 mb-6">Revenue distribution across categories</p>
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.categories}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {charts.categories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            formatter={(val: any) => [`${val}%`, 'Share']}
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="space-y-6">
                    {/* Inventory Chart */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <div className="mb-6">
                            <h3 className="font-semibold text-slate-900">Inventory Status by Category</h3>
                            <p className="text-sm text-slate-500">Current stock levels across all categories</p>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.inventory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: '500' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                                    <Bar dataKey="inStock" name="In Stock" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="lowStock" name="Low Stock" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="outOfStock" name="Out of Stock" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Inventory Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Valuation</p>
                                <h3 className="text-2xl font-bold mt-2 text-slate-900">{formatCurrency(inventoryStats.totalValuation)}</h3>
                                <p className="text-sm text-slate-400 mt-1">Total cost of stock on hand</p>
                            </div>
                            <div className="text-blue-500"><DollarSign size={20} /></div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Products</p>
                                <h3 className="text-2xl font-bold mt-2 text-slate-900">{inventoryStats.totalProducts.toLocaleString()}</h3>
                                <p className="text-sm text-slate-400 mt-1">Distinct SKUs</p>
                            </div>
                            <div className="text-slate-400"><Box size={20} /></div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
                                <h3 className="text-2xl font-bold mt-2 text-slate-900">{inventoryStats.lowStock}</h3>
                                <p className="text-sm text-orange-600 mt-1">Needs restocking</p>
                            </div>
                            <div className="text-orange-500"><Box size={20} /></div>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Out of Stock</p>
                                <h3 className="text-2xl font-bold mt-2 text-slate-900">{inventoryStats.outOfStock}</h3>
                                <p className="text-sm text-red-600 mt-1">Requires immediate action</p>
                            </div>
                            <div className="text-red-500"><Box size={20} /></div>
                        </div>
                    </div>

                    {/* Low Stock Alerts Table */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mt-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-semibold text-slate-900">Low Stock Alerts</h3>
                                <p className="text-sm text-slate-500">Items that need to be reordered soon</p>
                            </div>
                        </div>

                        {inventoryStats.lowStockItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                        <tr>
                                            <th className="py-3 px-4 rounded-tl-lg">Product Name</th>
                                            <th className="py-3 px-4">SKU/ID</th>
                                            <th className="py-3 px-4 text-right">Current Stock</th>
                                            <th className="py-3 px-4 text-right rounded-tr-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventoryStats.lowStockItems.map((item, idx) => (
                                            <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                                                <td className="py-3 px-4 text-slate-500 font-mono text-xs">{item.id.substring(0, 8).toUpperCase()}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {item.stock} in stock
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                                        Create PO
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Box size={32} className="mx-auto text-slate-300 mb-2" />
                                <p>All items are sufficiently stocked.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="bg-white p-12 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
                    <div className="w-full text-left mb-12">
                        <h3 className="font-semibold text-slate-900">Product Performance</h3>
                        <p className="text-sm text-slate-500">Detailed analysis of product sales and trends</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg mb-4 text-slate-400">
                        <BarChart3 size={48} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Product Analytics</h3>
                    <p className="text-slate-500 max-w-sm">
                        Detailed product performance metrics including views, conversion rates, and customer reviews will be displayed here.
                    </p>
                </div>
            )}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function KpiCard({ label, value, change }: any) {
    const isPositive = change >= 0;
    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-900">{value}</h3>
                    <p className={`text-xs font-medium mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{change}% <span className="text-slate-400 font-normal ml-1">vs prev period</span>
                    </p>
                </div>
                <div className="text-slate-400">
                    <DollarSign size={16} className="opacity-0" /> {/* Spacer */}
                </div>
            </div>
        </div>
    )
}
