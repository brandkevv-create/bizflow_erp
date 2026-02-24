import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface DashboardState {
    kpis: {
        revenue: { value: number; change: number };
        orders: { value: number; change: number };
        stock: { value: number; change: number };
        customers: { value: number; change: number };
    };
    finance: {
        outstanding: { amount: number; count: number };
        overdue: { amount: number; count: number };
        payments: { amount: number; count: number };
    };
    charts: {
        revenue: { date: string; value: number }[];
        categories: { name: string; value: number }[];
    };
    activity: {
        id: string;
        type: 'order' | 'payment' | 'stock' | 'customer' | 'shipping';
        title: string;
        desc: string;
        time: string;
    }[];
    isLoading: boolean;
    error: string | null;
    fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    kpis: {
        revenue: { value: 0, change: 0 },
        orders: { value: 0, change: 0 },
        stock: { value: 0, change: 0 },
        customers: { value: 0, change: 0 },
    },
    finance: {
        outstanding: { amount: 0, count: 0 },
        overdue: { amount: 0, count: 0 },
        payments: { amount: 0, count: 0 },
    },
    charts: {
        revenue: [],
        categories: [],
    },
    activity: [],
    isLoading: false,
    error: null,

    fetchDashboardData: async () => {
        set({ isLoading: true, error: null });
        try {
            // 1. Fetch Orders for Revenue and Order Count
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('*');

            if (ordersError) throw ordersError;

            // 2. Fetch Products for Stock
            const { data: dbProducts, error: productsError } = await supabase
                .from('products')
                .select('inventory_levels(stock_quantity), category_id, categories(name)');

            if (productsError) throw productsError;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const products = (dbProducts || []).map((p: any) => ({
                ...p,
                stock_quantity: p.inventory_levels?.reduce((sum: number, loc: any) => sum + (loc.stock_quantity || 0), 0) || 0
            }));

            // 3. Fetch Customers
            const { count: customersCount, error: customersError } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });

            if (customersError) throw customersError;

            // --- Calculations ---

            // 4. Fetch Invoices for Finance Stats
            const { data: invoices, error: invoicesError } = await supabase
                .from('invoices')
                .select('status, total_amount, paid_amount');

            if (invoicesError) throw invoicesError;

            // 5. Fetch Payments for Finance Stats (This Month)
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('amount')
                .eq('status', 'Completed')
                .gte('date', startOfMonth.toISOString());

            if (paymentsError) throw paymentsError;

            // --- Calculations ---

            // KPIs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (Number(order.total_amount) || 0), 0) || 0;
            const totalOrders = orders?.length || 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalStock = products?.reduce((sum: number, product: any) => sum + (product.stock_quantity || 0), 0) || 0;

            // Charts: Revenue (Last 7 days)
            const revenueMap = new Map<string, number>();
            const today = new Date();
            const last7Days = [];

            // Initialize last 7 days with 0
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dateKey = d.toISOString().split('T')[0];
                const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                revenueMap.set(dateKey, 0);
                last7Days.push({ key: dateKey, date: displayDate });
            }

            // Populate with actual order data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (orders || []).forEach((order: any) => {
                const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                if (revenueMap.has(orderDate)) {
                    revenueMap.set(orderDate, (revenueMap.get(orderDate) || 0) + Number(order.total_amount));
                }
            });

            const revenueChart = last7Days.map(day => ({
                date: day.date,
                value: revenueMap.get(day.key) || 0
            }));

            const categoryMap = new Map<string, number>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (products || []).forEach((p: any) => {
                const catName = p.categories?.name || 'Uncategorized';
                categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
            });
            const categoriesChart = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

            // Finance Widgets
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const outstandingInvoices = (invoices || []).filter((i: any) => i.status === 'Sent' || i.status === 'Overdue');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const overdueInvoices = (invoices || []).filter((i: any) => i.status === 'Overdue');

            const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);
            const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);

            const paymentsThisMonth = payments?.reduce((sum, pay) => sum + Number(pay.amount), 0) || 0;
            const paymentsCount = payments?.length || 0;

            // Activity (Latest 5 orders)
            const { data: recentOrders } = await supabase
                .from('orders')
                .select('*, customer:customers(full_name)')
                .order('created_at', { ascending: false })
                .limit(5);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const recentActivity = recentOrders?.map((order: any) => ({
                id: order.id,
                type: 'order' as const,
                title: `New order #${order.id.substring(0, 5)}`,
                desc: `${order.customer?.full_name || 'Guest'} placed an order for $${order.total_amount}`,
                time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })) || [];

            set({
                kpis: {
                    revenue: { value: totalRevenue, change: 0 }, // Change % is hard without historic data
                    orders: { value: totalOrders, change: 0 },
                    stock: { value: totalStock, change: 0 },
                    customers: { value: customersCount || 0, change: 0 },
                },
                charts: {
                    revenue: revenueChart,
                    categories: categoriesChart,
                },
                activity: recentActivity,
                finance: {
                    outstanding: { amount: outstandingAmount, count: outstandingInvoices.length },
                    overdue: { amount: overdueAmount, count: overdueInvoices.length },
                    payments: { amount: paymentsThisMonth, count: paymentsCount },
                },
            });

        } catch (error: unknown) {
            console.error('Error fetching dashboard data:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },
}));
