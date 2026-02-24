
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface SettingsState {
    business: {
        id?: string;
        name: string;
        email: string;
        phone: string;
        timezone: string;
        address: string;
        description: string;
        currency: string;
        taxRate: number;
        logo?: string;
    };
    team: {
        id: string;
        full_name: string;
        email: string;
        role: 'admin' | 'manager' | 'cashier' | 'warehouse';
        status: 'Active' | 'Inactive';
    }[];
    integrations: {
        id: string;
        name: string;
        status: 'Connected' | 'Not Connected';
        description: string;
        iconType: 'woo' | 'shopify' | 'mpesa' | 'stripe' | 'pos';
        config?: Record<string, unknown>;
    }[];
    notifications: {
        order: boolean;
        stock: boolean;
        messages: boolean;
        reports: boolean;
        channel: 'email' | 'sms';
    };
    roles: {
        role: string;
        permissions: { label: string; allowed: boolean }[];
    }[];
    apiKeys: {
        id: string;
        name: string;
        key: string;
        last_used_at: string | null;
        created_at: string;
    }[];
    isLoading: boolean;
    error: string | null;
    fetchSettings: () => Promise<void>;
    updateBusiness: (updates: Partial<SettingsState['business']>) => Promise<void>;
    toggleIntegration: (id: string, iconType: string) => Promise<void>;
    deleteTeamMember: (id: string) => void;
    addTeamMember: (member: Omit<SettingsState['team'][0], 'id'>) => Promise<void>;
    updateTeamMember: (id: string, updates: Partial<SettingsState['team'][0]>) => Promise<void>;
    updateNotification: (key: keyof SettingsState['notifications'], value: boolean | string) => void;
    toggleNotification: (key: keyof SettingsState['notifications']) => void;
    fetchApiKeys: () => Promise<void>;
    createApiKey: (name: string) => Promise<{ key: string } | null>;
    deleteApiKey: (id: string) => Promise<void>;
    updateIntegrationConfig: (id: string, iconType: string, config: Record<string, unknown>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    business: {
        name: 'My Business',
        email: '',
        phone: '',
        timezone: 'UTC',
        address: '',
        description: '',
        currency: 'USD',
        taxRate: 0,
    },
    team: [],
    integrations: [
        { id: '1', name: 'WooCommerce', status: 'Connected', description: 'Sync products and orders', iconType: 'woo', config: {} },
        { id: '2', name: 'Shopify', status: 'Not Connected', description: 'Connect your Shopify store', iconType: 'shopify', config: {} },
        { id: '3', name: 'M-Pesa', status: 'Connected', description: 'Accept mobile payments', iconType: 'mpesa', config: {} },
        { id: '4', name: 'Stripe', status: 'Connected', description: 'Process credit card payments', iconType: 'stripe', config: {} },
        { id: '5', name: 'POS System', status: 'Not Connected', description: 'Point of Sale integration', iconType: 'pos', config: {} },
    ],
    notifications: {
        order: true,
        stock: true,
        messages: true,
        reports: false,
        channel: 'email',
    },
    roles: [
        {
            role: 'admin',
            permissions: [
                { label: 'Full Access', allowed: true },
            ]
        },
        {
            role: 'manager',
            permissions: [
                { label: 'View Dashboard', allowed: true },
                { label: 'Manage Products', allowed: true },
                { label: 'Manage Settings', allowed: false },
            ]
        },
        {
            role: 'cashier',
            permissions: [
                { label: 'Point of Sale', allowed: true },
                { label: 'Manage Settings', allowed: false },
                { label: 'Finance & Reports', allowed: false },
            ]
        },
        {
            role: 'warehouse',
            permissions: [
                { label: 'Inventory Access', allowed: true },
                { label: 'Manage Settings', allowed: false },
                { label: 'Finance & Reports', allowed: false },
            ]
        }
    ],
    apiKeys: [],
    isLoading: false,
    error: null,

    fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
            // Fetch business profile
            const { data, error } = await supabase.from('settings').select('*').single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                throw error;
            }

            if (data) {
                set({
                    business: {
                        id: data.id,
                        name: data.business_name || '',
                        email: data.business_email || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        currency: data.currency || 'USD',
                        taxRate: Number(data.tax_rate) || 0,
                        logo: data.logo_url,
                        timezone: 'UTC', // Not in DB yet
                        description: '', // Not in DB yet
                    }
                });
            }

            // Fetch team members
            const { data: teamData } = await supabase.from('profiles').select('*');
            if (teamData) {
                set({
                    team: teamData.map(t => ({
                        id: t.id,
                        full_name: t.full_name || 'Unknown',
                        email: t.email || '',
                        role: t.role as 'admin' | 'manager' | 'cashier' | 'warehouse',
                        status: 'Active'
                    }))
                });
            }

            // Fetch integrations
            const { data: integrationsData, error: integrationsError } = await supabase.from('integrations').select('*');
            if (integrationsData && !integrationsError) {
                set((state) => {
                    const updatedIntegrations = state.integrations.map(inv => {
                        const dbProvider = inv.iconType === 'woo' ? 'woocommerce' : inv.iconType;
                        const record = integrationsData.find(d => d.provider === dbProvider);
                        if (record) {
                            return {
                                ...inv,
                                id: record.id,
                                status: (record.is_active ? 'Connected' : 'Not Connected') as 'Connected' | 'Not Connected',
                                config: {
                                    api_key: record.api_key || '',
                                    secret_key: record.secret_key || '',
                                    shop_url: record.shop_url || '',
                                }
                            };
                        }
                        return inv;
                    });
                    return { integrations: updatedIntegrations };
                });
            }

            // Fetch API Keys
            await get().fetchApiKeys();

        } catch (error: unknown) {
            console.error('Error fetching settings:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    updateBusiness: async (updates) => {
        set({ isLoading: true, error: null });
        try {
            const current = get().business;
            const payload = {
                business_name: updates.name,
                business_email: updates.email,
                phone: updates.phone,
                address: updates.address,
                currency: updates.currency,
                tax_rate: updates.taxRate,
                logo_url: updates.logo,
            };

            let error;
            if (current.id) {
                const { error: err } = await supabase.from('settings').update(payload).eq('id', current.id);
                error = err;
            } else {
                const { data, error: err } = await supabase.from('settings').insert(payload).select().single();
                if (data) set({ business: { ...current, ...updates, id: data.id } });
                error = err;
            }

            if (error) throw error;

            set((state) => ({
                business: { ...state.business, ...updates }
            }));

        } catch (error: unknown) {
            console.error('Error updating business:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    // Integrations methods
    toggleIntegration: async (id, iconType) => {
        const integration = get().integrations.find(i => i.id === id);
        if (!integration) return;

        const newIsActive = integration.status !== 'Connected';
        const providerName = iconType === 'woo' ? 'woocommerce' : iconType;

        set({ isLoading: true });
        try {
            const { data: existing } = await supabase.from('integrations').select('id').eq('provider', providerName).single();

            if (existing) {
                await supabase.from('integrations').update({ is_active: newIsActive }).eq('id', existing.id);
            } else {
                await supabase.from('integrations').insert({ provider: providerName, is_active: newIsActive });
            }
            await get().fetchSettings();
        } catch (error) {
            console.error('Error toggling integration:', error);
        } finally {
            set({ isLoading: false });
        }
    },
    updateIntegrationConfig: async (id, iconType, config) => {
        const providerName = iconType === 'woo' ? 'woocommerce' : iconType;
        set({ isLoading: true });
        try {
            const payload = {
                provider: providerName,
                api_key: config.api_key as string || null,
                secret_key: config.secret_key as string || null,
                shop_url: config.shop_url as string || null,
                is_active: true // Auto-connect on save
            };

            const { data: existing } = await supabase.from('integrations').select('id').eq('provider', providerName).single();
            if (existing) {
                await supabase.from('integrations').update(payload).eq('id', existing.id);
            } else {
                await supabase.from('integrations').insert(payload);
            }
            await get().fetchSettings();
        } catch (error) {
            console.error('Error saving integration config:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    // Local-only methods for now
    deleteTeamMember: (id) => set((state) => ({
        team: state.team.filter(t => t.id !== id)
    })),
    addTeamMember: async (member) => {
        // Mock UI addition since actual creation requires Auth Admin API or sign up
        set((state) => ({
            team: [...state.team, { ...member, id: Math.random().toString() }]
        }))
    },
    updateTeamMember: async (id, updates) => {
        try {
            const { error } = await supabase.from('profiles').update({ role: updates.role }).eq('id', id);
            if (error) throw error;
            set((state) => ({
                team: state.team.map(t => t.id === id ? { ...t, ...updates } : t)
            }));
        } catch (e) {
            console.error('Failed to update member role:', e);
        }
    },
    updateNotification: (key, value) => set((state) => ({
        notifications: { ...state.notifications, [key]: value }
    })),
    toggleNotification: (key) => set((state) => {
        if (key === 'channel') return state;
        return {
            notifications: { ...state.notifications, [key]: !state.notifications[key] }
        }
    }),

    fetchApiKeys: async () => {
        try {
            const { data, error } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                set({ apiKeys: data });
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        }
    },

    createApiKey: async (name) => {
        set({ isLoading: true });
        try {
            // Generate a secure random token
            const token = 'biz_live_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
                .map(b => b.toString(16).padStart(2, '0')).join('');

            const { data, error } = await supabase.from('api_keys').insert({
                name: name,
                key: token
            }).select().single();

            if (error) throw error;

            if (data) {
                set((state) => ({ apiKeys: [data, ...state.apiKeys] }));
                return { key: token };
            }
            return null;
        } catch (error) {
            console.error('Failed to create API key:', error);
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteApiKey: async (id) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase.from('api_keys').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({
                apiKeys: state.apiKeys.filter(k => k.id !== id)
            }));
        } catch (error) {
            console.error('Failed to delete API key:', error);
        } finally {
            set({ isLoading: false });
        }
    },
}));
