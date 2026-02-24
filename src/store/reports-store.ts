
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface TopProduct {
    id: string; // Changed to string (UUID)
    name: string;
    unitsSold: number;
    revenue: number;
}

interface ReportsState {
    kpis: {
        revenue: { value: number; change: number };
        orders: { value: number; change: number };
        aov: { value: number; change: number };
        profit: { value: number; change: number };
    };
    inventoryStats: {
        totalProducts: number;
        lowStock: number;
        outOfStock: number;
        totalValuation: number;
        lowStockItems: { id: string, name: string, stock: number }[];
    };
    charts: {
        trend: { month: string; revenue: number; profit: number }[];
        categories: { name: string; value: number; color: string }[];
        inventory: { category: string; inStock: number; lowStock: number; outOfStock: number }[];
    };
    topProducts: TopProduct[];
    isLoading: boolean;
    error: string | null;
    fetchReportsData: () => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set) => ({
    kpis: {
        revenue: { value: 0, change: 0 },
        orders: { value: 0, change: 0 },
        aov: { value: 0, change: 0 },
        profit: { value: 0, change: 0 },
    },
    inventoryStats: {
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValuation: 0,
        lowStockItems: [],
    },
    charts: {
        trend: [],
        categories: [],
        inventory: [],
    },
    topProducts: [],
    isLoading: false,
    error: null,

    fetchReportsData: async () => {
        set({ isLoading: true, error: null });
        try {
            // 1. Fetch Orders for KPIs and Trend
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, total_amount, created_at, status');

            if (ordersError) throw ordersError;

            // 2. Fetch Order Items for Top Products and Categories
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    unit_price,
                    order:orders (status, created_at),
                    product:products (
                        id,
                        name,
                        cost_price,
                        category:categories (name)
                    )
                `);

            if (itemsError) throw itemsError;

            // 3. Fetch Products for Inventory Stats
            const { data: dbProducts, error: productsError } = await supabase
                .from('products')
                .select(`
                    id,
                    name,
                    cost_price,
                    inventory_levels(stock_quantity),
                    category:categories (name)
                `);

            if (productsError) throw productsError;

            // 4. Fetch Expenses
            const { data: dbExpenses, error: expensesError } = await supabase
                .from('expenses')
                .select('amount, expense_date, status');

            if (expensesError) throw expensesError;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const products = (dbProducts || []).map((p: any) => ({
                ...p,
                stock_quantity: p.inventory_levels?.reduce((sum: number, loc: any) => sum + (loc.stock_quantity || 0), 0) || 0
            }));

            // --- CALCULATIONS ---

            // Helper: Valid Order Statuses
            const validStatuses = ['Paid', 'Fulfilled', 'Completed'];

            // Filter Orders
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validOrders = orders.filter((o: any) => validStatuses.includes(o.status));

            // KPIs
            const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
            const totalOrders = validOrders.length;
            const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            const validOrderItems = (orderItems || []).filter((item: any) => item.order && validStatuses.includes(item.order.status));

            const totalGrossProfit = validOrderItems.reduce((acc: number, item: any) => {
                const price = Number(item.unit_price) || 0;
                const cost = Number(item.product?.cost_price) || 0;
                const qty = Number(item.quantity) || 0;
                return acc + ((price - cost) * qty);
            }, 0);

            // Calculate Expenses
            const validExpenses = (dbExpenses || []).filter((e: any) => e.status === 'paid');
            const totalExpenses = validExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

            const netProfit = totalGrossProfit - totalExpenses;

            // Trend (Monthly)
            const trendMap = new Map<string, { revenue: number, profit: number }>();

            // We iterate over ITEMS to get accurate profit, but we need to match them to months.
            // Revenue is better tracked by Order Total (includes tax/shipping presumably), but Profit is item-based.
            // For Trend Revenue, we'll still use Orders. For Trend Profit, we'll sum items.

            // Init map with Orders for Revenue
            validOrders.forEach(o => {
                const date = new Date(o.created_at);
                const month = date.toLocaleString('default', { month: 'short' });
                const current = trendMap.get(month) || { revenue: 0, profit: 0 };
                trendMap.set(month, {
                    ...current,
                    revenue: current.revenue + (Number(o.total_amount) || 0)
                });
            });

            // Add Profit from Items
            validOrderItems.forEach((item: any) => {
                if (!item.order?.created_at) return;
                const date = new Date(item.order.created_at);
                const month = date.toLocaleString('default', { month: 'short' });
                const current = trendMap.get(month) || { revenue: 0, profit: 0 };

                const price = Number(item.unit_price) || 0;
                const cost = Number(item.product?.cost_price) || 0;
                const qty = Number(item.quantity) || 0;
                const profit = (price - cost) * qty;

                trendMap.set(month, {
                    ...current,
                    profit: current.profit + profit
                });
            });

            // Subtract Expenses from Trend Profit
            validExpenses.forEach((e: any) => {
                const date = new Date(e.expense_date);
                const month = date.toLocaleString('default', { month: 'short' });
                const current = trendMap.get(month) || { revenue: 0, profit: 0 };

                trendMap.set(month, {
                    ...current,
                    profit: current.profit - (Number(e.amount) || 0)
                });
            });

            const trend = Array.from(trendMap.entries()).map(([month, data]) => ({ month, ...data })); // Need to sort by date ideally



            // Top Products
            const productMap = new Map<string, { id: string, name: string, units: number, revenue: number }>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validOrderItems.forEach((item: any) => {
                if (!item.product) return;
                const id = item.product.id;
                const current = productMap.get(id) || { id, name: item.product.name, units: 0, revenue: 0 };
                productMap.set(id, {
                    ...current,
                    units: current.units + item.quantity,
                    revenue: current.revenue + (item.quantity * item.unit_price)
                });
            });
            const topProducts = Array.from(productMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map(p => ({ ...p, unitsSold: p.units })); // map to interface

            // Categories (Sales)
            const categorySalesMap = new Map<string, number>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validOrderItems.forEach((item: any) => {
                const catName = item.product?.category?.name || 'Uncategorized';
                const amount = item.quantity * item.unit_price;
                categorySalesMap.set(catName, (categorySalesMap.get(catName) || 0) + amount);
            });
            const categories = Array.from(categorySalesMap.entries()).map(([name, value], idx) => ({
                name,
                value,
                color: ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899'][idx % 5]
            }));

            // Inventory Stats
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lowItemsList = (products || []).filter((p: any) => p.stock_quantity < 10);

            const inventoryStats = {
                totalProducts: products?.length || 0,
                lowStock: lowItemsList.filter(p => p.stock_quantity > 0).length,
                outOfStock: lowItemsList.filter(p => p.stock_quantity === 0).length,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                totalValuation: (products || []).reduce((sum, p: any) => sum + (p.stock_quantity * (Number(p.cost_price) || 0)), 0),
                lowStockItems: lowItemsList.slice(0, 10).map(p => ({ id: p.id, name: p.name, stock: p.stock_quantity })),
            };

            // Inventory Chart (by Category)
            const invCatMap = new Map<string, { inStock: number, lowStock: number, outOfStock: number }>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (products || []).forEach((p: any) => {
                const catName = p.category?.name || 'Uncategorized';
                const current = invCatMap.get(catName) || { inStock: 0, lowStock: 0, outOfStock: 0 };
                if (p.stock_quantity === 0) current.outOfStock++;
                else if (p.stock_quantity < 10) current.lowStock++;
                else current.inStock++;
                invCatMap.set(catName, current);
            });
            const inventoryChart = Array.from(invCatMap.entries()).map(([category, stats]) => ({ category, ...stats }));


            set({
                kpis: {
                    revenue: { value: totalRevenue, change: 0 }, // Change % requires history comparison
                    orders: { value: totalOrders, change: 0 },
                    aov: { value: aov, change: 0 },
                    profit: { value: netProfit, change: 0 },
                },
                inventoryStats,
                charts: {
                    trend,
                    categories,
                    inventory: inventoryChart
                },
                topProducts,
            });

        } catch (error: unknown) {
            console.error('Error fetching reports:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    }
}));
