import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Product } from './inventory-store';

export type AdjustmentReason = 'shrinkage' | 'damage' | 'found' | 'initial_count' | 'return';
export type AdjustmentStatus = 'draft' | 'posted';

export interface StockAdjustmentItem {
    id: string;
    adjustment_id: string;
    product_id: string;
    expected_quantity: number;
    actual_quantity: number;
    product?: Product;
}

export interface StockAdjustment {
    id: string;
    reference_number: string;
    location_id: string;
    reason: AdjustmentReason;
    status: AdjustmentStatus;
    notes?: string;
    created_at: string;
    posted_at?: string;
    items?: StockAdjustmentItem[];
}

interface AuditsState {
    adjustments: StockAdjustment[];
    isLoading: boolean;
    error: string | null;
    fetchAdjustments: () => Promise<void>;
    createAdjustment: (data: Omit<StockAdjustment, 'id' | 'created_at' | 'status'>, items: Omit<StockAdjustmentItem, 'id' | 'adjustment_id'>[]) => Promise<void>;
    postAdjustment: (id: string) => Promise<void>;
}

export const useAuditsStore = create<AuditsState>((set, get) => ({
    adjustments: [],
    isLoading: false,
    error: null,

    fetchAdjustments: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('stock_adjustments')
                .select(`
                    *,
                    items:stock_adjustment_items(
                        *,
                        product:products(*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ adjustments: data as StockAdjustment[] });
        } catch (error: any) {
            console.error('Failed to fetch audits:', error);
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    createAdjustment: async (data, items) => {
        set({ isLoading: true, error: null });
        try {
            const { data: user } = await supabase.auth.getUser();

            // 1. Create Adj Record
            const { data: adj, error: adjError } = await supabase
                .from('stock_adjustments')
                .insert({
                    ...data,
                    created_by: user.user?.id
                })
                .select()
                .single();

            if (adjError) throw adjError;

            // 2. Create Items
            const itemsToInsert = items.map(item => ({
                ...item,
                adjustment_id: adj.id
            }));

            const { error: itemsError } = await supabase
                .from('stock_adjustment_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            await get().fetchAdjustments();

        } catch (error: any) {
            console.error('Failed to create audit:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    postAdjustment: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('stock_adjustments')
                .update({ status: 'posted' })
                .eq('id', id);

            if (error) throw error;

            await get().fetchAdjustments();

        } catch (error: any) {
            console.error('Failed to post audit:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
