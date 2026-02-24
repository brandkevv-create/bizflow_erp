"use client";

import { useLocationsStore, Location } from "@/store/locations-store";
import { useModal } from "@/hooks/use-modal-store";
import { useEffect } from "react";
import { Store, Plus, MapPin, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export function LocationsTab() {
    const { locations, isLoading, fetchLocations, deleteLocation } = useLocationsStore();
    const { onOpen } = useModal();

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}? This may break stock links if it contains inventory.`)) {
            await deleteLocation(id);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Physical Locations</h2>
                    <p className="text-sm text-slate-500">Manage stores, warehouses, and fulfillment centers.</p>
                </div>
                <button
                    onClick={() => onOpen("MANAGE_LOCATION")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={18} />
                    Add Location
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading && locations.length === 0 ? (
                    <div className="col-span-full py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : locations.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                        <Store className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No Locations Found</h3>
                        <p className="text-slate-500 mb-4 max-w-sm mx-auto text-sm">You haven't added any physical locations yet. Add your main store or warehouse to start tracking inventory.</p>
                        <button
                            onClick={() => onOpen("MANAGE_LOCATION")}
                            className="text-blue-600 font-medium hover:text-blue-700 mx-auto block"
                        >
                            + Setup First Location
                        </button>
                    </div>
                ) : (
                    locations.map((loc: Location) => (
                        <div key={loc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                        <Store size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {loc.name}
                                        </h3>
                                        <span className={`inline-block px-2 py-0.5 mt-1 rounded text-xs font-medium ${loc.type === 'store' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {loc.type === 'store' ? 'Retail Store' : 'Warehouse'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onOpen("MANAGE_LOCATION", loc)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(loc.id, loc.name)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5 space-y-3 bg-slate-50/50">
                                <div className="flex items-start gap-2 text-sm text-slate-600">
                                    <MapPin size={16} className="mt-0.5 text-slate-400" />
                                    <span>{loc.address || 'No address provided'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                                    <span>Status: <span className={loc.is_active ? 'text-green-600 font-medium' : 'text-slate-400'}>{loc.is_active ? 'Active' : 'Inactive'}</span></span>
                                    <span>Added {format(new Date(loc.created_at), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
