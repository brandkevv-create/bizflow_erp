"use client";

import { useEffect } from "react";
import { PosProductGrid } from "./pos-product-grid";
import { PosCart } from "./pos-cart";
import { useLocationsStore } from "@/store/locations-store";
import { useCartStore } from "@/store/cart-store";
import { Store } from "lucide-react";

export function PosLayout() {
    const { locations, fetchLocations } = useLocationsStore();
    const { locationId, setLocationId, clearCart } = useCartStore();

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    useEffect(() => {
        // Auto-select first store if none selected
        if (!locationId && locations.length > 0) {
            const firstStore = locations.find(l => l.type === 'store') || locations[0];
            setLocationId(firstStore.id);
        }
    }, [locations, locationId, setLocationId]);

    const handleLocationChange = (newLocationId: string) => {
        if (newLocationId !== locationId) {
            if (confirm("Changing location will clear your current cart. Proceed?")) {
                setLocationId(newLocationId);
                clearCart();
            }
        }
    };

    return (
        <div className="flex flex-col h-auto min-h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)] gap-4">
            {/* Top Bar: Location Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                        <Store size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">Active Register Location</h2>
                        <p className="text-xs text-slate-500">Sales will deduct inventory from this location</p>
                    </div>
                </div>
                <select
                    value={locationId || ''}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="" disabled>Select Location...</option>
                    {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                            {loc.name} {loc.type === 'warehouse' ? '(Warehouse)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Main POS Content */}
            <div className="flex flex-col lg:flex-row flex-1 gap-0 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 min-h-0">
                {/* Left: Product Selection */}
                <div className="flex-1 p-4 flex flex-col min-h-[60vh] lg:min-h-0 overflow-y-auto lg:overflow-hidden">
                    <PosProductGrid />
                </div>

                {/* Right: Cart */}
                <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shrink-0 min-h-[50vh] lg:min-h-0">
                    <PosCart />
                </div>
            </div>
        </div>
    );
}
