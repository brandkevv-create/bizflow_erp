import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ExpenseCategory {
    id: string;
    name: string;
    description?: string;
}

export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';

export interface Expense {
    id: string;
    reference_number: string;
    category_id: string;
    category_name?: string;
    amount: number;
    currency: string;
    expense_date: string;
    vendor?: string;
    receipt_url?: string;
    status: ExpenseStatus;
    notes?: string;
    created_at: string;
}

interface ExpensesState {
    expenses: Expense[];
    categories: ExpenseCategory[];
    isLoading: boolean;
    error: string | null;
    fetchExpenses: (filters?: { status?: ExpenseStatus, dateRange?: { start: string, end: string } }) => Promise<void>;
    fetchCategories: () => Promise<void>;
    addCategory: (data: Omit<ExpenseCategory, 'id'>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    addExpense: (data: Omit<Expense, 'id' | 'reference_number' | 'created_at' | 'category_name'>) => Promise<void>;
    updateExpenseStatus: (id: string, status: ExpenseStatus) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
    expenses: [],
    categories: [],
    isLoading: false,
    error: null,

    fetchCategories: async () => {
        try {
            const { data, error } = await supabase
                .from('expense_categories')
                .select('*')
                .order('name');
            if (error) throw error;
            set({ categories: data as ExpenseCategory[] });
        } catch (error: any) {
            console.error('Error fetching expense categories:', error);
        }
    },

    addCategory: async (data) => {
        try {
            const { error } = await supabase
                .from('expense_categories')
                .insert([data]);
            if (error) throw error;
            await get().fetchCategories();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            const { error } = await supabase
                .from('expense_categories')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await get().fetchCategories();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    fetchExpenses: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            let query = supabase
                .from('expenses')
                .select(`
                    *,
                    category:expense_categories(name)
                `)
                .order('expense_date', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.dateRange) {
                query = query.gte('expense_date', filters.dateRange.start)
                    .lte('expense_date', filters.dateRange.end);
            }

            const { data, error } = await query;
            if (error) throw error;

            const formattedExpenses: Expense[] = (data as any[]).map(e => ({
                id: e.id,
                reference_number: e.reference_number,
                category_id: e.category_id,
                category_name: e.category?.name,
                amount: Number(e.amount),
                currency: e.currency,
                expense_date: e.expense_date,
                vendor: e.vendor,
                receipt_url: e.receipt_url,
                status: e.status,
                notes: e.notes,
                created_at: e.created_at,
            }));

            set({ expenses: formattedExpenses });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    addExpense: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const reference_number = `EXP-${Math.floor(10000 + Math.random() * 90000)}`;

            const { error: insertError } = await supabase
                .from('expenses')
                .insert([{ ...data, reference_number }]);

            if (insertError) throw insertError;

            await get().fetchExpenses();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateExpenseStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('expenses')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            await get().fetchExpenses();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteExpense: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await get().fetchExpenses();
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
