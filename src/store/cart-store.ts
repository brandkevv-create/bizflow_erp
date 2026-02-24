import { create } from 'zustand';
import { Product } from '@/types/inventory';

export interface CartItem extends Product {
    quantity: number;
}

interface CartState {
    locationId: string | null;
    setLocationId: (id: string | null) => void;
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    locationId: null,
    setLocationId: (id) => set({ locationId: id }),
    items: [],
    addToCart: (product) => {
        set((state) => {
            const existingItem = state.items.find((item) => item.id === product.id);
            if (existingItem) {
                return {
                    items: state.items.map((item) =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                };
            }
            return { items: [...state.items, { ...product, quantity: 1 }] };
        });
    },
    removeFromCart: (productId) =>
        set((state) => ({
            items: state.items.filter((item) => item.id !== productId),
        })),
    updateQuantity: (productId, quantity) =>
        set((state) => ({
            items: state.items.map((item) =>
                item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
            ),
        })),
    clearCart: () => set({ items: [] }),
    getTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
    },
}));
