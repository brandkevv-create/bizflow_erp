import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Location {
    id: string;
    name: string;
    address?: string;
    type: 'store' | 'warehouse';
    is_active: boolean;
    created_at: string;
}

interface LocationsState {
    locations: Location[];
    isLoading: boolean;
    error: string | null;
    fetchLocations: () => Promise<void>;
    addLocation: (location: Omit<Location, 'id' | 'created_at'>) => Promise<void>;
    updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
    deleteLocation: (id: string) => Promise<void>;
}

export const useLocationsStore = create<LocationsState>((set, get) => ({
    locations: [],
    isLoading: false,
    error: null,

    fetchLocations: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('name');

            if (error) throw error;
            set({ locations: data || [] });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch locations' });
        } finally {
            set({ isLoading: false });
        }
    },

    addLocation: async (location) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('locations')
                .insert([location])
                .select()
                .single();

            if (error) throw error;
            set({ locations: [...get().locations, data] });
        } catch (error: any) {
            set({ error: error.message || 'Failed to add location' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateLocation: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('locations')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            set({ locations: get().locations.map(l => l.id === id ? data : l) });
        } catch (error: any) {
            set({ error: error.message || 'Failed to update location' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteLocation: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('locations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            set({ locations: get().locations.filter(l => l.id !== id) });
        } catch (error: any) {
            set({ error: error.message || 'Failed to delete location' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
