"use client";

import { useState } from "react";
import { useInventoryStore } from "@/store/inventory-store";
import { useModal } from "@/hooks/use-modal-store";
import { AlertTriangle, Download, Filter, Plus, Search } from "lucide-react";
import { ActionDropdown } from "@/components/ui/action-dropdown";
import { exportToCSV } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

export default function ProductsPage() {
    const { products, alerts, deleteProduct, categories } = useInventoryStore();
    const { onOpen } = useModal();
    const { addToast } = useToast();
    const { showDialog } = useConfirmDialog();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    // Filter products based on search and filters
    const filteredProducts = products.filter(product => {
        const matchesSearch = searchTerm === "" ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || product.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    const toggleSelectAll = () => {
        if (selectedProductIds.length === filteredProducts.length) {
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(filteredProducts.map(p => p.id));
        }
    };

    const toggleSelectOne = (id: string) => {
        if (selectedProductIds.includes(id)) {
            setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
        } else {
            setSelectedProductIds([...selectedProductIds, id]);
        }
    };

    const handleExport = () => {
        const dataToExport = selectedProductIds.length > 0
            ? filteredProducts.filter(p => selectedProductIds.includes(p.id))
            : filteredProducts;

        exportToCSV(dataToExport, 'products');
        if (selectedProductIds.length > 0) {
            addToast('success', `Exported ${selectedProductIds.length} selected products`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
                    <p className="text-slate-500">Manage your product catalog and inventory</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onOpen("MANAGE_CATEGORIES")}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Filter size={18} />
                        Categories
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Download size={18} />
                        {selectedProductIds.length > 0 ? `Export Selected (${selectedProductIds.length})` : 'Export'}
                    </button>
                    <button
                        onClick={() => onOpen("ADD_PRODUCT")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Alert Banners */}
            <div className="space-y-3">
                {alerts.lowStock > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800">
                        <AlertTriangle size={20} className="text-orange-600" />
                        <p className="text-sm font-medium">
                            <span className="font-bold">{alerts.lowStock} products</span> running low on stock. Consider restocking soon.
                        </p>
                    </div>
                )}
                {alerts.outOfStock > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                        <AlertTriangle size={20} className="text-red-600" />
                        <p className="text-sm font-medium">
                            <span className="font-bold">{alerts.outOfStock} product</span> out of stock. Update inventory immediately.
                        </p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-4">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">SKU</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Price</th>
                                <th className="px-6 py-3">Stock</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Last Updated</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${selectedProductIds.includes(product.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedProductIds.includes(product.id)}
                                            onChange={() => toggleSelectOne(product.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                                    <td className="px-6 py-4 text-slate-500 font-mono">{product.sku}</td>
                                    <td className="px-6 py-4 text-slate-600">{product.category}</td>
                                    <td className="px-6 py-4 text-slate-900">${product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-900">{product.stock}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{product.updatedAt}</td>
                                    <td className="px-6 py-4 text-right">
                                        <ActionDropdown
                                            onEdit={() => onOpen("EDIT_PRODUCT", product)}
                                            onCustomAction={() => onOpen("STOCK_ADJUSTMENT", product)}
                                            customActionLabel="Adjust Stock"
                                            onDelete={() => {
                                                showDialog({
                                                    title: 'Delete Product',
                                                    message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
                                                    confirmText: 'Delete',
                                                    type: 'danger',
                                                    onConfirm: () => {
                                                        deleteProduct(product.id);
                                                        addToast('success', 'Product deleted successfully');
                                                    }
                                                });
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'In Stock': return 'bg-green-100 text-green-700';
        case 'Low Stock': return 'bg-orange-100 text-orange-700';
        case 'Out of Stock': return 'bg-red-100 text-red-700';
        default: return 'bg-slate-100 text-slate-700';
    }
}
