"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { DollarSign, Package, ShoppingBag, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export function DashboardStats() {
    const { kpis, isLoading } = useDashboardStore();
    const formatCurrency = useFormatCurrency();

    if (isLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl" />
            ))}
        </div>;
    }

    const stats = [
        {
            label: "Total Revenue",
            value: formatCurrency(kpis.revenue.value),
            change: kpis.revenue.change,
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-100",
        },
        {
            label: "Total Orders",
            value: kpis.orders.value.toLocaleString(),
            change: kpis.orders.change,
            icon: ShoppingBag,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
        {
            label: "Total Stock",
            value: kpis.stock.value.toLocaleString(),
            change: kpis.stock.change,
            icon: Package,
            color: "text-orange-600",
            bg: "bg-orange-100",
        },
        {
            label: "Active Customers",
            value: kpis.customers.value.toLocaleString(),
            change: kpis.customers.change,
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-100",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <h3 className="text-2xl font-bold mt-2 text-slate-900">{stat.value}</h3>
                        <div className={`flex items-center mt-1 text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                            <span className="font-medium">{Math.abs(stat.change)}%</span>
                            <span className="text-slate-400 ml-1">vs last week</span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                        <stat.icon size={24} />
                    </div>
                </div>
            ))}
        </div>
    );
}
