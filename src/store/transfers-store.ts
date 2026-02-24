import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Product } from './inventory-store';

export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

export interface StockTransferItem {
    id: string;
    transfer_id: string;
    product_id: string;
    quantity: number;
    product?: Product;
}

export interface StockTransfer {
    id: string;
    reference_number: string;
    source_location_id: string;
    destination_location_id: string;
    status: TransferStatus;
    notes?: string;
    created_at: string;
    shipped_at?: string;
    received_at?: string;
    items?: StockTransferItem[];
}

interface TransfersState {
    transfers: StockTransfer[];
    isLoading: boolean;
    error: string | null;
    fetchTransfers: () => Promise<void>;
    createTransfer: (data: Omit<StockTransfer, 'id' | 'created_at' | 'status'>, items: Omit<StockTransferItem, 'id' | 'transfer_id'>[]) => Promise<void>;
    updateTransferStatus: (id: string, status: TransferStatus) => Promise<void>;
}

export const useTransfersStore = create<TransfersState>((set, get) => ({
    transfers: [],
    isLoading: false,
    error: null,

    fetchTransfers: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('stock_transfers')
                .select(`
                    *,
                    items:stock_transfer_items(
                        *,
                        product:products(*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ transfers: data as StockTransfer[] });
        } catch (error: any) {
            console.error('Failed to fetch transfers:', error);
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    createTransfer: async (data, items) => {
        set({ isLoading: true, error: null });
        try {
            const { data: user } = await supabase.auth.getUser();

            // 1. Create Transfer Record
            const { data: transfer, error: transferError } = await supabase
                .from('stock_transfers')
                .insert({
                    ...data,
                    created_by: user.user?.id
                })
                .select()
                .single();

            if (transferError) throw transferError;

            // 2. Create Items
            const itemsToInsert = items.map(item => ({
                ...item,
                transfer_id: transfer.id
            }));

            const { error: itemsError } = await supabase
                .from('stock_transfer_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            await get().fetchTransfers();

        } catch (error: any) {
            console.error('Failed to create transfer:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateTransferStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('stock_transfers')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            await get().fetchTransfers();

        } catch (error: any) {
            console.error('Failed to update transfer status:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
