import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface User {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'manager' | 'cashier' | 'warehouse';
    avatar_url?: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<any>;
    devLogin: () => void;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    error: null,

    checkSession: async () => {
        set({ isLoading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                set({
                    user: {
                        id: session.user.id,
                        email: session.user.email!,
                        full_name: profile?.full_name,
                        role: profile?.role || 'cashier',
                        avatar_url: profile?.avatar_url
                    },
                    error: null
                });
            } else {
                set({ user: null });
            }
        } catch (error) {
            console.error('Session check failed:', error);
            set({ user: null });
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                set({
                    user: {
                        id: data.user.id,
                        email: data.user.email!,
                        full_name: profile?.full_name,
                        role: profile?.role || 'cashier',
                        avatar_url: profile?.avatar_url
                    }
                });
            }
        } catch (error: any) {
            set({ error: error.message || 'Failed to login' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    signUp: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: email.split('@')[0], // Default name from email
                    }
                }
            });

            if (error) throw error;

            // Note: If email confirmation is on, session will be null
            if (data.session) {
                set({
                    user: {
                        id: data.user!.id,
                        email: data.user!.email!,
                        full_name: data.user!.user_metadata.full_name,
                        role: 'cashier', // Default
                    }
                });
            }

            return data;
        } catch (error: any) {
            set({ error: error.message || 'Failed to sign up' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await supabase.auth.signOut();
            set({ user: null, error: null });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },
    devLogin: async () => {
        set({ isLoading: true, error: null });
        try {
            await get().login('demo@bizflow.com', 'demo123');
        } catch (error) {
            console.error('Dev login failed:', error);
            set({ error: 'Dev Access failed. Please ensure demo user exists.' });
        }
    },
}));
