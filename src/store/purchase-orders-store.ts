import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Supplier } from './suppliers-store';
import { Location } from './locations-store';
import { Product } from '@/types/inventory';

export interface PurchaseOrderItem {
    id: string;
    po_id: string;
    product_id: string;
    quantity: number;
    unit_cost: number;
    received_quantity: number;
    product?: Product;
}

export interface PurchaseOrder {
    id: string;
    po_number: string;
    supplier_id: string;
    location_id: string;
    status: 'draft' | 'ordered' | 'received' | 'cancelled';
    total_amount: number;
    expected_date: string | null;
    created_at: string;
    updated_at: string;
    supplier?: Supplier;
    location?: Location;
    items?: PurchaseOrderItem[];
}

interface PurchaseOrdersState {
    purchaseOrders: PurchaseOrder[];
    isLoading: boolean;
    error: string | null;
    fetchPurchaseOrders: () => Promise<void>;
    createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>, items: Omit<PurchaseOrderItem, 'id' | 'po_id' | 'received_quantity'>[]) => Promise<void>;
    updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => Promise<void>;
}

export const usePurchaseOrdersStore = create<PurchaseOrdersState>((set, get) => ({
    purchaseOrders: [],
    isLoading: false,
    error: null,

    fetchPurchaseOrders: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select(`
                    *,
                    supplier:suppliers(*),
                    location:locations(*),
                    items:purchase_order_items(*, product:products(*))
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ purchaseOrders: data as PurchaseOrder[] || [] });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch purchase orders' });
        } finally {
            set({ isLoading: false });
        }
    },

    createPurchaseOrder: async (po, items) => {
        set({ isLoading: true, error: null });
        try {
            // 1. Create PO
            const { data: poData, error: poError } = await supabase
                .from('purchase_orders')
                .insert([po])
                .select()
                .single();

            if (poError) throw poError;

            // 2. Create PO Items
            const poItems = items.map(item => ({
                po_id: poData.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                received_quantity: 0
            }));

            const { error: itemsError } = await supabase
                .from('purchase_order_items')
                .insert(poItems);

            if (itemsError) throw itemsError;

            // Refresh to get joined data
            await get().fetchPurchaseOrders();
        } catch (error: any) {
            set({ error: error.message || 'Failed to create purchase order' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updatePurchaseOrderStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('purchase_orders')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            await get().fetchPurchaseOrders();
        } catch (error: any) {
            set({ error: error.message || 'Failed to update PO status' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
