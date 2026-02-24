"use client";

import { useInventoryStore } from "@/store/inventory-store";
import { useCartStore } from "@/store/cart-store";
import { useState, useEffect } from "react";
import { Search, Image as ImageIcon, Plus } from "lucide-react";
import Image from "next/image";

export function PosProductGrid() {
    const {
        products,
        categories: storeCategories,
        fetchProducts,
        isLoading,
        searchQuery,
        selectedCategory,
        currentPage,
        pageSize,
        totalProducts,
        setSearchQuery,
        setSelectedCategory,
        setPage
    } = useInventoryStore();
    const { addToCart } = useCartStore();

    useEffect(() => {
        if (products.length === 0 && !searchQuery && selectedCategory === "All") {
            fetchProducts();
        }
    }, [fetchProducts, products.length, searchQuery, selectedCategory]);

    // Derived state for categories
    const categories = ["All", ...storeCategories];
    const totalPages = Math.ceil(totalProducts / pageSize) || 1;

    if (isLoading && products.length === 0) {
        return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-xl" />
            ))}
        </div>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Search and Filter */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <p>No products found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="group bg-white rounded-xl border border-slate-200 p-3 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col h-full"
                            >
                                <div className="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400 overflow-hidden relative">
                                    {product.imageUrl ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={product.imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <ImageIcon size={32} />
                                    )}
                                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Plus className="text-blue-600 bg-white rounded-full p-1" size={24} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-slate-900 text-sm line-clamp-2 leading-tight mb-1">{product.name}</h3>
                                    <p className="text-xs text-slate-500 mb-2">{product.sku}</p>
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="font-bold text-slate-900">${product.price.toFixed(2)}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {product.stock} left
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                        <button
                            onClick={() => setPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1 || isLoading}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm font-medium"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || isLoading}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm font-medium"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
