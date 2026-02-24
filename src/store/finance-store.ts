
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    customer: {
        id: string; // Added ID for linking
        name: string;
        email: string;
    };
    issueDate: string;
    dueDate: string; // Optional in DB?
    amount: number;
    paidAmount: number;
    status: 'Paid' | 'Sent' | 'Overdue' | 'Draft' | 'Cancelled';
    items: {
        description: string;
        qty: number;
        unitPrice: number;
        amount: number;
    }[];
    paymentLinkUrl?: string;
}

export interface Payment {
    id: string;
    invoiceId?: string;
    invoiceNumber?: string; // Added field
    customer?: string; // Name
    date: string;
    method: string;
    amount: number;
    status: 'Completed' | 'Pending' | 'Failed';
    reference?: string;
    notes?: string;
}

interface FinanceState {
    invoices: Invoice[];
    invoiceStats: {
        invoiced: number;
        paid: number;
        pending: number;
        overdue: number;
    };
    payments: Payment[];
    paymentStats: {
        received: number;
        completed: number;
        pending: number;
        thisMonth: number;
    };
    isLoading: boolean;
    error: string | null;
    fetchInvoices: () => Promise<void>;
    fetchPayments: () => Promise<void>;
    createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'paidAmount'> & { customerId: string, status: string }) => Promise<void>;
    updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
    addPayment: (payment: Omit<Payment, 'id'> & { customerId?: string }) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    invoices: [],
    invoiceStats: {
        invoiced: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
    },
    payments: [],
    paymentStats: {
        received: 0,
        completed: 0,
        pending: 0,
        thisMonth: 0,
    },
    isLoading: false,
    error: null,

    fetchInvoices: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customer:customers(id, full_name, email),
                    invoice_items(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const invoices: Invoice[] = (data || []).map((inv: any) => ({
                id: inv.id,
                invoiceNumber: inv.invoice_number || 'INV-????',
                customer: {
                    id: inv.customer?.id,
                    name: inv.customer?.full_name || 'Unknown',
                    email: inv.customer?.email || '',
                },
                issueDate: new Date(inv.issue_date || inv.created_at).toLocaleDateString(),
                dueDate: inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '',
                amount: Number(inv.total_amount),
                paidAmount: Number(inv.paid_amount),
                status: inv.status,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                items: inv.invoice_items?.map((item: any) => ({
                    description: item.description,
                    qty: Number(item.quantity),
                    unitPrice: Number(item.unit_price),
                    amount: Number(item.amount)
                })) || [],
                paymentLinkUrl: inv.payment_link_url
            }));

            // Calc stats
            const stats = invoices.reduce((acc, curr) => {
                acc.invoiced += curr.amount;
                acc.paid += curr.paidAmount;
                if (curr.status === 'Sent') acc.pending += (curr.amount - curr.paidAmount);
                if (curr.status === 'Overdue') acc.overdue += (curr.amount - curr.paidAmount);
                return acc;
            }, { invoiced: 0, paid: 0, pending: 0, overdue: 0 });

            set({ invoices, invoiceStats: stats });
        } catch (error: unknown) {
            console.error('Error fetching invoices:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    fetchPayments: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('payments')
                .select(`
                    *,
                    customer:customers(full_name),
                    invoice:invoices(id, invoice_number)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payments: Payment[] = (data || []).map((pay: any) => ({
                id: pay.id.length > 8 ? `PAY-${pay.id.substring(0, 6).toUpperCase()}` : pay.id, // Format UUIDs
                invoiceId: pay.invoice_id,
                invoiceNumber: pay.invoice?.invoice_number || 'N/A', // Map invoice number
                customer: pay.customer?.full_name || 'Unknown', // Payment might link to customer directly
                date: new Date(pay.date || pay.created_at).toLocaleDateString(),
                method: pay.payment_method || pay.method || 'Unknown',
                amount: Number(pay.amount),
                status: pay.status,
                reference: pay.reference,
                notes: pay.notes
            }));

            // Calc stats
            const stats = payments.reduce((acc, curr) => {
                if (curr.status === 'Completed') {
                    acc.received += curr.amount;
                    acc.completed++;
                }
                if (curr.status === 'Pending') acc.pending++;
                // thisMonth logic approximation
                const isThisMonth = new Date(curr.date).getMonth() === new Date().getMonth();
                if (isThisMonth && curr.status === 'Completed') acc.thisMonth += curr.amount;
                return acc;
            }, { received: 0, completed: 0, pending: 0, thisMonth: 0 });

            set({ payments, paymentStats: stats });
        } catch (error: unknown) {
            console.error('Error fetching payments:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    createInvoice: async (invoice) => {
        set({ isLoading: true, error: null });
        try {
            // Get next invoice number
            const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
            const nextNumber = `INV-${((count || 0) + 1).toString().padStart(4, '0')}`;

            // 1. Create Invoice Header
            const { data: invData, error: invError } = await supabase
                .from('invoices')
                .insert({
                    customer_id: invoice.customerId,
                    invoice_number: nextNumber,
                    issue_date: new Date().toISOString(), // Use provided date if available
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days default
                    status: invoice.status || 'Draft',
                    total_amount: invoice.amount,
                    paid_amount: 0
                })
                .select()
                .single();

            if (invError) throw invError;

            // 2. Create Items
            const items = invoice.items.map(item => ({
                invoice_id: invData.id,
                description: item.description,
                quantity: item.qty,
                unit_price: item.unitPrice,
                amount: item.amount
            }));

            const { error: itemsError } = await supabase.from('invoice_items').insert(items);
            if (itemsError) throw itemsError;

            await get().fetchInvoices();
        } catch (error: unknown) {
            console.error('Error creating invoice:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateInvoice: async (id, invoice) => {
        set({ isLoading: true, error: null });
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updates: any = {};
            if (invoice.status) updates.status = invoice.status;
            if (invoice.amount !== undefined) updates.total_amount = invoice.amount;
            if (invoice.paidAmount !== undefined) updates.paid_amount = invoice.paidAmount;

            let paymentAdded = false;

            // Auto-update paid_amount if status is explicitly set to Paid 
            if (invoice.status === 'Paid' && invoice.paidAmount === undefined) {
                const currentInvoice = get().invoices.find(inv => inv.id === id);
                if (currentInvoice) {
                    updates.paid_amount = updates.total_amount !== undefined ? updates.total_amount : currentInvoice.amount;

                    const difference = updates.paid_amount - currentInvoice.paidAmount;
                    if (difference > 0) {
                        const { error: payError } = await supabase.from('payments').insert({
                            invoice_id: id,
                            customer_id: currentInvoice.customer.id,
                            amount: difference,
                            payment_method: 'Manual Entry',
                            status: 'Completed',
                            reference: 'Manual Status Update',
                            date: new Date().toISOString()
                        });
                        if (!payError) paymentAdded = true;
                    }
                }
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase
                    .from('invoices')
                    .update(updates)
                    .eq('id', id);
                if (error) throw error;
            }

            await get().fetchInvoices();
            if (paymentAdded) await get().fetchPayments();

        } catch (error: unknown) {
            console.error('Error updating invoice:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    addPayment: async (payment) => {
        set({ isLoading: true, error: null });
        try {
            // 1. Record Payment
            const { error: payError } = await supabase.from('payments').insert({
                invoice_id: payment.invoiceId,
                customer_id: payment.customerId,
                amount: payment.amount,
                payment_method: payment.method,
                status: payment.status,
                reference: payment.reference,
                notes: payment.notes,
                date: new Date().toISOString()
            });

            if (payError) throw payError;

            // 2. Update Invoice Paid Amount
            if (payment.invoiceId && payment.status === 'Completed') {
                // Fetch current invoice
                const { data: inv } = await supabase.from('invoices').select('paid_amount, total_amount').eq('id', payment.invoiceId).single();
                if (inv) {
                    const newPaid = Number(inv.paid_amount) + payment.amount;
                    const newStatus = newPaid >= Number(inv.total_amount) ? 'Paid' : 'Sent'; // Simplified status logic

                    await supabase.from('invoices').update({
                        paid_amount: newPaid,
                        status: newStatus
                    }).eq('id', payment.invoiceId);
                }
            }

            await get().fetchPayments();
            await get().fetchInvoices(); // Refresh invoices too
        } catch (error: unknown) {
            console.error('Error adding payment:', error);
            if (error instanceof Error) {
                set({ error: error.message });
            }
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteInvoice: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase.from('invoices').delete().eq('id', id);
            if (error) throw error;
            await get().fetchInvoices();
        } catch (error: unknown) {
            if (error instanceof Error) {
                set({ error: error.message });
            }
        } finally {
            set({ isLoading: false });
        }
    }
}));
