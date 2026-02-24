"use client";

import { useState } from 'react';
import { CreditCard, Smartphone, ShieldCheck, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface PaymentPanelProps {
    invoiceId: string;
    balanceDue: number;
    isPaid: boolean;
    currency: string;
}

export function PaymentPanel({ invoiceId, balanceDue, isPaid, currency }: PaymentPanelProps) {
    const [isLoadingStripe, setIsLoadingStripe] = useState(false);
    const [isLoadingMpesa, setIsLoadingMpesa] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'sent' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const handleStripeCheckout = async () => {
        setIsLoadingStripe(true);
        setErrorMessage('');
        try {
            const res = await fetch(`/api/checkout/stripe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_id: invoiceId })
            });
            const data = await res.json();

            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                setErrorMessage(data.error || 'Failed to initialize secure checkout');
            }
        } catch (err: any) {
            setErrorMessage('Network error occurred. Please try again.');
        } finally {
            setIsLoadingStripe(false);
        }
    };

    const handleMpesaCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) {
            setErrorMessage('Please enter a valid M-Pesa phone number');
            return;
        }

        setIsLoadingMpesa(true);
        setErrorMessage('');
        setMpesaStatus('idle');

        try {
            const res = await fetch(`/api/checkout/mpesa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_id: invoiceId, phone_number: phoneNumber })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setMpesaStatus('sent');
            } else {
                setErrorMessage(data.error || 'Failed to initiate M-Pesa payment');
            }
        } catch (err: any) {
            setErrorMessage('Network error occurred. Please try again.');
        } finally {
            setIsLoadingMpesa(false);
        }
    };

    if (isPaid) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden text-center p-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Complete</h3>
                <p className="text-slate-500 mb-6">This invoice has been fully paid. Thank you for your business!</p>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg text-sm transition-colors"
                >
                    Download Receipt
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Balance Due</p>
                <p className="text-4xl font-bold text-slate-900">{formatCurrency(balanceDue)}</p>
            </div>

            <div className="p-6 space-y-6">
                {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm">
                        {errorMessage}
                    </div>
                )}

                {/* Secure Card Payment Option */}
                <div>
                    <button
                        onClick={handleStripeCheckout}
                        disabled={isLoadingStripe || isLoadingMpesa}
                        className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-50 font-medium group"
                    >
                        <div className="flex items-center gap-3">
                            {isLoadingStripe ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
                            <span>Pay securely with Card</span>
                        </div>
                        <ArrowRight size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                        <ShieldCheck size={14} />
                        <span>Powered by Stripe. 256-bit secure encryption.</span>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500 font-medium">Or pay with M-Pesa</span>
                    </div>
                </div>

                {/* Mobile Money Payment Option */}
                {mpesaStatus === 'sent' ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                        <Smartphone className="mx-auto text-green-600 mb-2" size={24} />
                        <h4 className="font-bold text-green-800 mb-1">Check your phone!</h4>
                        <p className="text-sm text-green-700">An M-Pesa payment prompt has been sent to your phone. Enter your PIN to complete the transaction.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors w-full"
                        >
                            I have paid
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleMpesaCheckout} className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">M-Pesa Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Smartphone size={16} />
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="e.g. 0712 345 678"
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                    disabled={isLoadingMpesa || isLoadingStripe}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoadingMpesa || isLoadingStripe || !phoneNumber}
                            className="w-full flex items-center justify-center gap-2 p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                        >
                            {isLoadingMpesa ? <Loader2 className="animate-spin" size={18} /> : 'Send M-Pesa Prompt'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
