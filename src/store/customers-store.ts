
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Customer {
    id: string;
    initials: string;
    name: string;
    email: string;
    phone: string;
    joinedDate: string;
    ordersCount: number;
    totalSpent: number;
    lastOrderDate: string;
    status: 'Active' | 'Inactive';
    address?: string;
    company_name?: string;
    tax_id?: string;
    credit_limit?: number;
}

interface CustomersState {
    customers: Customer[];
    isLoading: boolean;
    error: string | null;
    stats: {
        total: number;
        active: number;
        avgOrderValue: number;
        lifetimeValue: number;
    };
    fetchCustomers: () => Promise<void>;
    addCustomer: (customer: Customer) => void;
    updateCustomer: (id: string, updates: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
    customers: [],
    isLoading: false,
    error: null,
    stats: {
        total: 0,
        active: 0,
        avgOrderValue: 0,
        lifetimeValue: 0
    },

    fetchCustomers: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    orders (
                        total_amount,
                        created_at
                    )
                `);

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customers: Customer[] = (data || []).map((item: any) => {
                const orders = item.orders || [];
                const ordersCount = orders.length;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);
                const lastOrderDate = orders.length > 0
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? new Date(Math.max(...orders.map((o: any) => new Date(o.created_at).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A';

                // Parse address if it's JSON
                let addressStr = '';
                if (item.address) {
                    if (typeof item.address === 'string') addressStr = item.address;
                    else if (typeof item.address === 'object') addressStr = `${item.address.street}, ${item.address.city}, ${item.address.country}`;
                }

                return {
                    id: item.id,
                    initials: item.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                    name: item.full_name,
                    email: item.email,
                    phone: item.phone || '',
                    joinedDate: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    ordersCount,
                    totalSpent,
                    lastOrderDate,
                    status: ordersCount > 0 ? 'Active' : 'Inactive',
                    address: addressStr,
                    company_name: item.company_name,
                    tax_id: item.tax_id,
                    credit_limit: Number(item.credit_limit || 0),
                };
            });

            // Calculate global stats
            const total = customers.length;
            const active = customers.filter(c => c.status === 'Active').length;
            const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
            const totalOrders = customers.reduce((sum, c) => sum + c.ordersCount, 0);
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const lifetimeValue = totalRevenue; // Simplified LTV

            set({
                customers,
                stats: {
                    total,
                    active,
                    avgOrderValue: Number(avgOrderValue.toFixed(2)),
                    lifetimeValue: Number(lifetimeValue.toFixed(2))
                }
            });
        } catch (error: unknown) {
            console.error('Error fetching customers:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    addCustomer: (customer) => set((state) => ({
        customers: [customer, ...state.customers]
    })),
    updateCustomer: (id, updates) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    })),
    deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter((c) => c.id !== id)
    })),
}));
