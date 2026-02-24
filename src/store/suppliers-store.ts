import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Supplier {
    id: string;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
}

interface SuppliersState {
    suppliers: Supplier[];
    isLoading: boolean;
    error: string | null;
    fetchSuppliers: () => Promise<void>;
    addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
}

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
    suppliers: [],
    isLoading: false,
    error: null,

    fetchSuppliers: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            set({ suppliers: data as Supplier[] || [] });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch suppliers' });
        } finally {
            set({ isLoading: false });
        }
    },

    addSupplier: async (supplier) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('suppliers')
                .insert([supplier]);

            if (error) throw error;
            await get().fetchSuppliers();
        } catch (error: any) {
            set({ error: error.message || 'Failed to add supplier' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateSupplier: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('suppliers')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            await get().fetchSuppliers();
        } catch (error: any) {
            set({ error: error.message || 'Failed to update supplier' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteSupplier: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await get().fetchSuppliers();
        } catch (error: any) {
            set({ error: error.message || 'Failed to delete supplier' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
