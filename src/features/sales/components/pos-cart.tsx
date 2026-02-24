"use client";

import { useCartStore } from "@/store/cart-store";
import { Trash2, ShoppingCart } from "lucide-react";

import { useModal } from "@/hooks/use-modal-store";

export function PosCart() {
    const { items, updateQuantity, removeFromCart, getTotal } = useCartStore();
    const { onOpen } = useModal();

    const handleCheckout = () => {
        onOpen("POS_CHECKOUT");
    };

    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <ShoppingCart size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Cart is empty</p>
                <p className="text-sm">Select products to start a sale</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white border-l border-slate-200">
            <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Current Order</h2>
                <span className="text-xs text-slate-500">{items.length} items</span>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                        <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">${item.price.toFixed(2)} / unit</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 h-8 text-sm text-center border border-slate-300 rounded-md focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">${getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Tax (10%)</span>
                    <span className="font-medium">${(getTotal() * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>${(getTotal() * 1.1).toFixed(2)}</span>
                </div>

                <button
                    onClick={handleCheckout}
                    className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Checkout
                </button>
            </div>
        </div>
    );
}
