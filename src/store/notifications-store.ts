
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    link?: string;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;

    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    fetchNotifications: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    addNotification: (notification) => {
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substring(7),
            read: false,
            createdAt: new Date(),
        };

        set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },

    markAsRead: (id) => {
        set((state) => {
            const notifications = state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            );
            return {
                notifications,
                unreadCount: notifications.filter((n) => !n.read).length,
            };
        });
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const notifications: Notification[] = [];

            // 1. Check Low Stock
            const { data: dbProducts } = await supabase
                .from('products')
                .select('id, name, inventory_levels(stock_quantity)');

            // Calculate total stock manually since we can't filter by relation sum directly in Supabase API
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lowStockProducts = (dbProducts || [])
                .map((p: any) => ({
                    ...p,
                    stock_quantity: p.inventory_levels?.reduce((sum: number, loc: any) => sum + (loc.stock_quantity || 0), 0) || 0
                }))
                .filter(p => p.stock_quantity > 0 && p.stock_quantity < 10)
                .slice(0, 5);

            if (lowStockProducts.length > 0) {
                lowStockProducts.forEach((p) => {
                    notifications.push({
                        id: `low-stock-${p.id}`,
                        type: 'warning',
                        title: 'Low Stock Alert',
                        message: `${p.name} has only ${p.stock_quantity} items left.`,
                        read: false,
                        createdAt: new Date(),
                        link: '/dashboard/inventory',
                    });
                });
            }

            // 2. Check Recent Pending Orders (Last 24h)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { data: recentOrders } = await supabase
                .from('orders')
                .select('id, total_amount, created_at, customer:customers(full_name)')
                .eq('status', 'Pending')
                .gte('created_at', yesterday.toISOString())
                .order('created_at', { ascending: false })
                .limit(5);

            if (recentOrders) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                recentOrders.forEach((o: any) => {
                    notifications.push({
                        id: `new-order-${o.id}`,
                        type: 'info',
                        title: 'New Order Received',
                        message: `Order #${o.id.substring(0, 8).toUpperCase()} from ${o.customer?.full_name || 'Guest'} ($${o.total_amount})`,
                        read: false,
                        createdAt: new Date(o.created_at),
                        link: '/dashboard/sales',
                    });
                });
            }

            // Merge with existing notifications to avoid duplicates if ID matches
            // (For this simple version, we'll just replace the list with fetched alerts to keep it fresh)
            set({
                notifications,
                unreadCount: notifications.filter((n) => !n.read).length,
            });

        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            set({ isLoading: false });
        }
    },
}));
