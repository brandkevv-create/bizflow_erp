"use client";

import { useEffect } from "react";
import { useInventoryStore } from "@/store/inventory-store";
import { InventoryStats } from "@/features/inventory/components/inventory-stats";
import { ProductList } from "@/features/inventory/components/product-list";
import { Download, Plus, ArrowRightLeft, Building2 } from "lucide-react";
import { useModal } from "@/hooks/use-modal-store";
import Link from "next/link";

export default function InventoryPage() {
    const { fetchProducts } = useInventoryStore();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products & Inventory</h1>
                    <p className="text-slate-500">Manage your product catalog and stock levels</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/inventory/suppliers"
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Building2 size={18} />
                        Vendors
                    </Link>
                    <Link
                        href="/dashboard/inventory/transfers"
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <ArrowRightLeft size={18} />
                        Transfers
                    </Link>
                    <button
                        onClick={() => {
                            const { products } = useInventoryStore.getState();
                            import("@/lib/export").then(({ exportToCSV }) => {
                                exportToCSV(products, 'inventory-products');
                            });
                        }}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export
                    </button>
                    <button
                        onClick={() => useModal.getState().onOpen("ADD_PRODUCT")}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats */}
            <InventoryStats />

            {/* Product List */}
            <ProductList />
        </div>
    );
}
