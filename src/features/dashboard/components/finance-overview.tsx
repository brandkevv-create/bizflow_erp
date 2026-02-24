"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { AlertCircle, CreditCard, FileText } from "lucide-react";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export function FinanceOverview() {
    const { finance, isLoading } = useDashboardStore();
    const formatCurrency = useFormatCurrency();

    if (isLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
        </div>;
    }

    const cards = [
        {
            label: "Outstanding Invoices",
            amount: finance.outstanding.amount,
            count: finance.outstanding.count,
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
            desc: "invoices"
        },
        {
            label: "Overdue Invoices",
            amount: finance.overdue.amount,
            count: finance.overdue.count,
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50",
            desc: "invoices"
        },
        {
            label: "Payments This Month",
            amount: finance.payments.amount,
            count: finance.payments.count,
            icon: CreditCard,
            color: "text-green-600",
            bg: "bg-green-50",
            desc: "invoices"
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Finance Overview</h3>
                <button className="text-sm font-medium text-slate-500 hover:text-slate-900">View Details</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">{card.label}</p>
                            <h3 className="text-2xl font-bold mt-1 text-slate-900">{formatCurrency(card.amount)}</h3>
                            <p className="text-xs text-slate-400 mt-1">{card.count} {card.desc}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                            <card.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
