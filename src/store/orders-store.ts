
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Order {
    id: string; // UUID
    displayId: string; // Shortened ID
    customer: {
        name: string;
        email: string;
    };
    itemsCount: number;
    total: number;
    status: 'Pending' | 'Paid' | 'Fulfilled' | 'Cancelled';
    source: 'Online' | 'Physical Store';
    date: string;
}

interface OrdersState {
    orders: Order[];
    isLoading: boolean;
    error: string | null;
    stats: {
        pending: number;
        paid: number;
        fulfilled: number;
        cancelled: number;
    };

    totalOrders: number;
    currentPage: number;
    pageSize: number;
    searchQuery: string;
    selectedStatus: string;

    setSearchQuery: (query: string) => void;
    setSelectedStatus: (status: string) => void;
    setPage: (page: number) => void;
    fetchOrders: () => Promise<void>;
    createOrder: (customerId: string | null, locationId: string | null, items: { id: string, quantity: number, price: number }[], total: number, paymentMethod: string) => Promise<string | undefined>;
    addOrder: (order: Order) => void;
    updateOrder: (id: string, updates: Partial<Order>) => Promise<void>; // Changed to Promise
    deleteOrder: (id: string) => Promise<void>; // Changed to Promise
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
    orders: [],
    isLoading: false,
    error: null,
    stats: {
        pending: 0,
        paid: 0,
        fulfilled: 0,
        cancelled: 0,
    },

    totalOrders: 0,
    currentPage: 1,
    pageSize: 50,
    searchQuery: '',
    selectedStatus: 'All',

    setSearchQuery: async (query) => {
        set({ searchQuery: query, currentPage: 1 });
        await get().fetchOrders();
    },
    setSelectedStatus: async (status) => {
        set({ selectedStatus: status, currentPage: 1 });
        await get().fetchOrders();
    },
    setPage: async (page) => {
        set({ currentPage: page });
        await get().fetchOrders();
    },

    fetchOrders: async () => {
        const { currentPage, pageSize, searchQuery, selectedStatus } = get();
        set({ isLoading: true, error: null });

        try {
            let query = supabase
                .from('orders')
                .select(`
                    *,
                    customer:customers(full_name, email),
                    order_items(count)
                `, { count: 'exact' });

            if (searchQuery) {
                // We're casting 'id' to text for search, but PostgREST exact UUID matching requires eq, so we rely on customer search primarily
                // For a robust fuzzy search on UUID displayIds, we'd need a DB view or text column.
                // For now, we search customer.full_name or email.
                query = query.or(`customer.full_name.ilike.%${searchQuery}%,customer.email.ilike.%${searchQuery}%`);
            }
            if (selectedStatus && selectedStatus !== 'All') {
                query = query.eq('status', selectedStatus);
            }

            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const orders: Order[] = (data || []).map((item: any) => ({
                id: item.id, // UUID
                displayId: item.id.substring(0, 8).toUpperCase(), // Pseudo ID
                customer: {
                    name: item.customer?.full_name || 'Unknown',
                    email: item.customer?.email || '',
                },
                itemsCount: item.order_items?.[0]?.count || 0,
                total: Number(item.total_amount),
                status: (item.status.charAt(0).toUpperCase() + item.status.slice(1)) as Order['status'],
                source: 'Online', // Default
                date: new Date(item.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            }));

            // Calculate exact stats via lightweight global query
            const { data: allStatuses } = await supabase.from('orders').select('status');
            const newStats = {
                pending: allStatuses?.filter(o => o.status === 'Pending').length || 0,
                paid: allStatuses?.filter(o => o.status === 'Paid').length || 0,
                fulfilled: allStatuses?.filter(o => o.status === 'Fulfilled').length || 0,
                cancelled: allStatuses?.filter(o => o.status === 'Cancelled').length || 0,
            };

            set({
                orders,
                totalOrders: count || 0,
                stats: newStats
            });
        } catch (error: unknown) {
            console.error('Error fetching orders:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    createOrder: async (customerId: string | null, locationId: string | null, items: { id: string, quantity: number, price: number }[], total: number, paymentMethod: string) => {
        set({ isLoading: true, error: null });
        try {
            console.log('Creating order for customer:', customerId, 'at location:', locationId); // Debug

            // Normalize customerId
            const finalCustomerId = customerId === "" ? null : customerId;
            const initialStatus = (paymentMethod === 'Card' || paymentMethod === 'Unpaid') ? 'Pending' : 'Completed';

            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: finalCustomerId,
                    location_id: locationId,
                    status: initialStatus,
                    total_amount: total,
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Create Payment Record
            if (paymentMethod !== 'Card' && paymentMethod !== 'Unpaid') {
                const { error: paymentError } = await supabase
                    .from('payments')
                    .insert({
                        order_id: orderData.id,
                        amount: total,
                        status: 'Completed',
                        payment_method: paymentMethod
                    });

                if (paymentError) throw paymentError;
            }

            // 4. Refresh Orders
            await get().fetchOrders();

            return orderData.id;

        } catch (error: unknown) {
            console.error('Error creating order:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
            throw error; // Re-throw so UI can handle success/failure
        } finally {
            set({ isLoading: false });
        }
    },

    addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
    })),

    updateOrder: async (id: string, updates: Partial<Order>) => {
        set({ isLoading: true, error: null });
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dbUpdates: any = {};
            if (updates.status) dbUpdates.status = updates.status;

            if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase
                    .from('orders')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) throw error;
            }

            // Optimistic update or refresh
            // For simplicity, just refresh
            await get().fetchOrders();

        } catch (error) {
            console.error('Error updating order:', error);
            if (error instanceof Error) set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    deleteOrder: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                orders: state.orders.filter((o) => o.id !== id)
            }));

            // Refresh logic to update stats
            await get().fetchOrders();

        } catch (error) {
            console.error('Error deleting order:', error);
            if (error instanceof Error) set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },
}));
