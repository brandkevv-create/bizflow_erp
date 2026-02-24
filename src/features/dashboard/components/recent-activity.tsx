"use client";

import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard-store";
import { CreditCard, Package, ShoppingCart, Truck, User } from "lucide-react";

export function RecentActivity() {
    const { activity, isLoading } = useDashboardStore();
    const router = useRouter();

    if (isLoading) {
        return <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96 animate-pulse" />;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingCart size={16} />;
            case 'payment': return <CreditCard size={16} />;
            case 'stock': return <Package size={16} />;
            case 'shipping': return <Truck size={16} />;
            case 'customer': return <User size={16} />;
            default: return <ShoppingCart size={16} />;
        }
    };

    const getColors = (type: string) => {
        switch (type) {
            case 'order': return 'bg-blue-100 text-blue-600';
            case 'payment': return 'bg-green-100 text-green-600';
            case 'stock': return 'bg-orange-100 text-orange-600';
            case 'shipping': return 'bg-purple-100 text-purple-600';
            case 'customer': return 'bg-pink-100 text-pink-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                <button
                    onClick={() => router.push('/dashboard/orders')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    View All
                </button>
            </div>

            <div className="space-y-6">
                {activity.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No recent activity</p>
                ) : (
                    activity.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => router.push('/dashboard/orders')}
                            className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getColors(item.type)}`}>
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{item.desc}</p>
                            </div>
                            <div className="text-xs text-slate-400 whitespace-nowrap pt-1">
                                {item.time}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
