"use client";

import { Product } from "@/types/inventory";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface PosProductCardProps {
    product: Product;
    onClick: (product: Product) => void;
}

export function PosProductCard({ product, onClick }: PosProductCardProps) {
    const isOutOfStock = product.stock <= 0;

    return (
        <button
            onClick={() => !isOutOfStock && onClick(product)}
            disabled={isOutOfStock}
            className={cn(
                "flex flex-col text-left p-4 bg-white rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-blue-300",
                isOutOfStock && "opacity-50 cursor-not-allowed hover:border-slate-200 hover:shadow-sm"
            )}
        >
            <div className="w-full h-32 bg-slate-100 rounded-md mb-3 flex items-center justify-center text-slate-400">
                <Package size={32} />
            </div>
            <div>
                <h3 className="font-medium text-slate-900 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{product.sku}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-slate-900">${product.price.toFixed(2)}</span>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", isOutOfStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                        {isOutOfStock ? "Out of Stock" : `${product.stock} left`}
                    </span>
                </div>
            </div>
        </button>
    );
}
