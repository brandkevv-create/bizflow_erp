"use client";

import { useInventoryStore } from "@/store/inventory-store";
import { AlertCircle } from "lucide-react";

export function InventoryStats() {
    const { alerts, isLoading } = useInventoryStore();

    if (isLoading) {
        return <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-slate-100 rounded-lg" />
            <div className="h-16 bg-slate-100 rounded-lg" />
        </div>;
    }

    if (alerts.lowStock === 0 && alerts.outOfStock === 0) {
        return null; // Don't show anything if no alerts (or maybe show "All Good"?)
    }

    return (
        <div className="space-y-4">
            {alerts.lowStock > 0 && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-orange-50 border border-orange-100 text-orange-900">
                    <div className="mt-0.5">
                        <AlertCircle size={20} className="text-orange-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-orange-900">
                            <span className="font-bold mr-1">{alerts.lowStock}</span>
                            products running low on stock. Consider restocking soon.
                        </p>
                    </div>
                </div>
            )}

            {alerts.outOfStock > 0 && (
                <div className="flex items-start gap-4 p-4 rounded-lg bg-red-50 border border-red-100 text-red-900">
                    <div className="mt-0.5">
                        <AlertCircle size={20} className="text-red-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-red-900">
                            <span className="font-bold mr-1">{alerts.outOfStock}</span>
                            product{alerts.outOfStock !== 1 ? 's' : ''} out of stock. Update inventory immediately.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
