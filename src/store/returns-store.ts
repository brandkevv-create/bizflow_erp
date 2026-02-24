import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ReturnItem {
    id: string;
    return_id: string;
    order_item_id: string;
    quantity: number;
    restock: boolean;
    product_name?: string;
}

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export interface Return {
    id: string;
    reference_number: string;
    order_id: string;
    order_display_id?: string;
    customer_id?: string;
    customer_name?: string;
    status: ReturnStatus;
    reason: string;
    refund_amount: number;
    created_at: string;
    items?: ReturnItem[];
}

interface ReturnsState {
    returns: Return[];
    isLoading: boolean;
    error: string | null;
    fetchReturns: () => Promise<void>;
    createReturn: (data: { order_id: string, customer_id?: string, reason: string, refund_amount: number, items: { order_item_id: string, quantity: number, restock: boolean }[] }) => Promise<void>;
    updateReturnStatus: (id: string, status: ReturnStatus) => Promise<void>;
}

export const useReturnsStore = create<ReturnsState>((set, get) => ({
    returns: [],
    isLoading: false,
    error: null,

    fetchReturns: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('returns')
                .select(`
                    *,
                    orders!returns_order_id_fkey(id),
                    customers(full_name),
                    return_items(
                        id,
                        order_item_id,
                        quantity,
                        restock,
                        order_items(
                            product:products(name)
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsedReturns: Return[] = data.map((ret: any) => ({
                id: ret.id,
                reference_number: ret.reference_number,
                order_id: ret.order_id,
                order_display_id: ret.orders?.id ? ret.orders.id.substring(0, 8).toUpperCase() : 'UNKNOWN',
                customer_id: ret.customer_id,
                customer_name: ret.customers?.full_name || 'Walk-in Customer',
                status: ret.status,
                reason: ret.reason,
                refund_amount: Number(ret.refund_amount),
                created_at: new Date(ret.created_at).toLocaleDateString(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                items: ret.return_items?.map((item: any) => ({
                    id: item.id,
                    return_id: ret.id,
                    order_item_id: item.order_item_id,
                    quantity: Number(item.quantity),
                    restock: item.restock,
                    product_name: item.order_items?.product?.name || 'Unknown Product'
                })) || []
            }));

            set({ returns: parsedReturns });
        } catch (error: any) {
            console.error('Error fetching returns:', error);
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    createReturn: async (data) => {
        set({ isLoading: true, error: null });
        try {
            // Generate Reference Number
            const refNumber = `RMA-${Math.floor(100000 + Math.random() * 900000)}`;

            // 1. Create Return
            const { data: newReturn, error: returnError } = await supabase
                .from('returns')
                .insert({
                    reference_number: refNumber,
                    order_id: data.order_id,
                    customer_id: data.customer_id || null,
                    reason: data.reason,
                    refund_amount: data.refund_amount,
                    status: 'pending'
                })
                .select('id')
                .single();

            if (returnError) throw returnError;

            // 2. Insert Return Items
            if (data.items.length > 0) {
                const itemsToInsert = data.items.map(item => ({
                    return_id: newReturn.id,
                    order_item_id: item.order_item_id,
                    quantity: item.quantity,
                    restock: item.restock
                }));

                const { error: itemsError } = await supabase
                    .from('return_items')
                    .insert(itemsToInsert);

                if (itemsError) throw itemsError;
            }

            await get().fetchReturns();
        } catch (error: any) {
            console.error('Error creating return:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateReturnStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('returns')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            await get().fetchReturns();
        } catch (error: any) {
            console.error('Error updating return status:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
