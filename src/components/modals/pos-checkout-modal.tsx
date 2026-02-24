"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useCartStore } from "@/store/cart-store";
import { useOrdersStore } from "@/store/orders-store";
import { useCustomersStore } from "@/store/customers-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Banknote, Smartphone, Check, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const PosCheckoutModal = () => {
    const { isOpen, onClose, type } = useModal();
    const { getTotal, clearCart, items, locationId } = useCartStore();
    const { createOrder, isLoading } = useOrdersStore();
    const { customers, fetchCustomers } = useCustomersStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "POS_CHECKOUT";
    const total = getTotal();
    const totalWithTax = total * 1.1; // 10% tax as per cart logic

    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile' | 'Unpaid'>('Cash');
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [change, setChange] = useState<number>(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const [isWaitingForMpesa, setIsWaitingForMpesa] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        if (isModalOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPaymentMethod('Cash');
            setAmountTendered('');
            setChange(0);
            setSelectedCustomerId(null);
            setPhoneNumber('');
            setIsWaitingForMpesa(false);
            fetchCustomers();
        }
    }, [isModalOpen]);

    useEffect(() => {
        if (amountTendered) {
            const tendered = parseFloat(amountTendered);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setChange(Math.max(0, tendered - totalWithTax));
        } else {
            setChange(0);
        }
    }, [amountTendered, totalWithTax]);

    const handleComplete = async () => {
        // Use a small epsilon for floating point comparison to avoid precision errors
        if (paymentMethod === 'Cash' && (parseFloat(amountTendered) < totalWithTax - 0.01)) {
            addToast('error', 'Insufficient amount tendered');
            return;
        }

        if (paymentMethod === 'Mobile' && !phoneNumber) {
            addToast('error', 'Please enter a valid M-Pesa phone number (e.g. 0712345678)');
            return;
        }

        if (paymentMethod === 'Unpaid') {
            if (!selectedCustomerId) {
                addToast('error', 'Please select a customer for Credit Account.');
                return;
            }
            const customer = customers.find(c => c.id === selectedCustomerId);
            if (!customer || !customer.credit_limit || customer.credit_limit <= 0) {
                addToast('error', 'This customer does not have an active credit limit.');
                return;
            }

            try {
                // Fetch unpaid invoices
                const { data: invData, error: invError } = await supabase
                    .from('invoices')
                    .select('total_amount, paid_amount')
                    .eq('customer_id', selectedCustomerId)
                    .neq('status', 'Paid')
                    .neq('status', 'Cancelled');

                if (invError) throw invError;

                let unpaidBalance = 0;
                if (invData) {
                    unpaidBalance = invData.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);
                }

                // Check pending orders (not yet invoiced)
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('total_amount')
                    .eq('customer_id', selectedCustomerId)
                    .eq('status', 'Pending');

                if (orderData) {
                    unpaidBalance += orderData.reduce((sum, o) => sum + Number(o.total_amount), 0);
                }

                if (unpaidBalance + totalWithTax > customer.credit_limit) {
                    addToast('error', `Credit Limit Exceeded. Available Credit: $${Math.max(0, customer.credit_limit - unpaidBalance).toFixed(2)}`);
                    return;
                }
            } catch (error: any) {
                console.error(error);
                addToast('error', 'Failed to verify credit limit.');
                return;
            }
        }

        try {
            const orderId = await createOrder(
                selectedCustomerId,
                locationId,
                items,
                totalWithTax,
                paymentMethod === 'Mobile' ? 'Pending' : paymentMethod // M-Pesa is pending until callback
            );

            if (paymentMethod === 'Card' && orderId) {
                const res = await fetch('/api/checkout/stripe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_id: orderId })
                });

                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                    return; // End flow, let Stripe redirect handle the rest
                } else {
                    addToast('error', data.error || 'Failed to start Stripe checkout');
                    return;
                }
            }

            if (paymentMethod === 'Mobile' && orderId) {
                setIsWaitingForMpesa(true);
                const res = await fetch('/api/checkout/mpesa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_id: orderId, phone_number: phoneNumber })
                });

                const data = await res.json();
                setIsWaitingForMpesa(false);

                if (data.success) {
                    addToast('success', 'M-Pesa STK Push sent! Please ask customer to enter PIN.');
                    clearCart();
                    onClose();
                    return;
                } else {
                    addToast('error', data.error || 'Failed to initiate M-Pesa payment');
                    return;
                }
            }

            clearCart();
            addToast('success', 'Sale completed successfully!');
            onClose();
        } catch (error: any) {
            console.error(error);
            setIsWaitingForMpesa(false);
            addToast('error', error.message || 'Failed to complete sale. Please try again.');
        }
    };

    const paymentMethods = [
        { id: 'Cash', icon: Banknote, label: 'Cash' },
        { id: 'Card', icon: CreditCard, label: 'Card' },
        { id: 'Mobile', icon: Smartphone, label: 'Mobile Money' },
        { id: 'Unpaid', icon: Clock, label: 'Credit Account' },
    ] as const;

    return (
        <Modal
            title="Complete Sale"
            description="Process payment for current order."
            isOpen={isModalOpen}
            onClose={onClose}
            maxWidth="max-w-md"
        >
            <div className="space-y-6">
                {/* Total Display */}
                <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1 uppercase tracking-wide font-semibold">Total Amount</p>
                    <p className="text-4xl font-bold text-slate-900">${totalWithTax.toFixed(2)}</p>
                </div>



                {/* Customer Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Customer</label>
                    <select
                        className="w-full h-10 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={selectedCustomerId || ""}
                        onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                    >
                        <option value="">Walk-in Customer</option>
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name} ({customer.email})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all ${paymentMethod === method.id
                                ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <method.icon size={24} />
                            <span className="text-xs font-medium">{method.label}</span>
                        </button>
                    ))}
                </div>

                {/* Cash Input */}
                {paymentMethod === 'Cash' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Amount Tendered</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                <input
                                    type="number"
                                    value={amountTendered}
                                    onChange={(e) => setAmountTendered(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-7 pr-4 py-3 text-lg border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-sm font-medium text-green-700">Change Due</span>
                            <span className="text-xl font-bold text-green-700">${change.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* M-Pesa Input */}
                {paymentMethod === 'Mobile' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">M-Pesa Phone Number</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="e.g. 0712345678"
                                    className="w-full pl-10 pr-4 py-3 text-lg border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-slate-500 text-center">A payment prompt will be sent to this number.</p>
                        </div>
                    </div>
                )}

                <div className="pt-4">
                    <button
                        onClick={handleComplete}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || (paymentMethod === 'Cash' && (!amountTendered || parseFloat(amountTendered) < totalWithTax - 0.01))}
                    >
                        {isLoading ? (
                            <span>Processing...</span>
                        ) : (
                            <>
                                <Check size={20} />
                                Complete Sale
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal >
    );
};
