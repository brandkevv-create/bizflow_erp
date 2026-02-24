"use client";

import { useEffect } from "react";
import { useSuppliersStore } from "@/store/suppliers-store";
import { useModal } from "@/hooks/use-modal-store";
import { Plus, ArrowLeft, Mail, Phone, MapPin, Building2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function SuppliersPage() {
    const { suppliers, fetchSuppliers, isLoading, deleteSupplier } = useSuppliersStore();
    const { onOpen } = useModal();

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete supplier "${name}"? This action cannot be undone.`)) {
            await deleteSupplier(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard/inventory" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendors & Suppliers</h1>
                    </div>
                    <p className="text-slate-500">Manage your supplier directory and contacts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onOpen("MANAGE_SUPPLIER")}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Vendor
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading && suppliers.length === 0 ? (
                    <div className="col-span-full py-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : suppliers.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white border border-slate-200 border-dashed rounded-xl shadow-sm">
                        <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No Suppliers Found</h3>
                        <p className="text-slate-500 mb-4 max-w-sm mx-auto text-sm">Build your vendor directory to streamline purchase orders and restocks.</p>
                        <button
                            onClick={() => onOpen("MANAGE_SUPPLIER")}
                            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors shadow-sm inline-flex items-center gap-2"
                        >
                            <Plus size={16} /> Add First Vendor
                        </button>
                    </div>
                ) : (
                    suppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                            <div className="p-5 border-b border-slate-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center rounded-lg shadow-sm">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 text-lg leading-tight">{supplier.name}</h3>
                                            {supplier.contact_person && (
                                                <p className="text-sm text-slate-500 mt-0.5">{supplier.contact_person}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 -mr-2">
                                        <button
                                            onClick={() => onOpen("MANAGE_SUPPLIER", supplier)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(supplier.id, supplier.name)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 bg-slate-50/50 space-y-3">
                                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                    <Mail size={16} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{supplier.email || <span className="text-slate-400 italic">No email</span>}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                    <Phone size={16} className="text-slate-400 shrink-0" />
                                    <span>{supplier.phone || <span className="text-slate-400 italic">No phone</span>}</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-sm text-slate-600">
                                    <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{supplier.address || <span className="text-slate-400 italic">No physical address listed</span>}</span>
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-slate-100 bg-white text-xs text-slate-400 flex justify-between">
                                <span>Added {format(new Date(supplier.created_at), 'MMM d, yyyy')}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
