"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Sheet } from "@/components/ui/sheet";
import { Customer } from "@/store/customers-store";
import { Mail, Phone, MapPin, Edit, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateAccountStatement } from "@/lib/pdf/generate-statement";

export const ViewCustomerSheet = () => {
    const { isOpen, onClose, onOpen, type, data } = useModal();
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const isModalOpen = isOpen && type === "VIEW_CUSTOMER";
    const customer = data as Customer;

    if (!isModalOpen || !customer) return null;

    // Mock Order History (since we don't have a direct link in store yet, mimicking the screenshot data)
    const mockHistory = [
        { id: '#3847', date: 'Jan 30, 2026', amount: 115.97, status: 'pending' },
        { id: '#3789', date: 'Jan 15, 2026', amount: 245.50, status: 'fulfilled' },
    ];

    return (
        <Sheet
            isOpen={isModalOpen}
            onClose={onClose}
            width="max-w-md"
        >
            <div className="space-y-8">
                {/* Header Profile */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold uppercase">
                        {customer.initials}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{customer.company_name || customer.name}</h2>
                        {customer.company_name && <p className="text-sm font-medium text-slate-700">{customer.name}</p>}
                        <p className="text-sm text-slate-500">Customer since {customer.joinedDate}</p>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Information</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm">
                            <Mail size={16} className="text-slate-400 mt-0.5" />
                            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">{customer.email}</a>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                            <Phone size={16} className="text-slate-400 mt-0.5" />
                            <span className="text-slate-700">{customer.phone}</span>
                        </div>
                        {customer.address && (
                            <div className="flex items-start gap-3 text-sm">
                                <MapPin size={16} className="text-slate-400 mt-0.5" />
                                <span className="text-slate-700">{customer.address}</span>
                            </div>
                        )}
                        {customer.tax_id && (
                            <div className="flex items-start gap-3 text-sm">
                                <span className="text-slate-500 font-medium">Tax ID:</span>
                                <span className="text-slate-700">{customer.tax_id}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* KPIs & Credit */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-slate-900">{customer.ordersCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Total Spent</p>
                        <p className="text-2xl font-bold text-slate-900">${customer.totalSpent.toLocaleString()}</p>
                    </div>
                    {customer.credit_limit ? (
                        <div className="col-span-2 mt-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-700 font-medium mb-1">Available Credit Limit</p>
                            <p className="text-2xl font-bold text-blue-900">${customer.credit_limit.toLocaleString()}</p>
                        </div>
                    ) : null}
                </div>

                {/* Order History */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Order History</h3>
                    <div className="space-y-0 divide-y divide-slate-100 border-t border-b border-slate-100">
                        {mockHistory.map((order) => (
                            <div key={order.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">{order.id}</p>
                                    <p className="text-xs text-slate-500">{order.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-slate-900">${order.amount.toFixed(2)}</p>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${order.status === 'fulfilled' ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex flex-col gap-3">
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                addToast('success', `Email sent to ${customer.email}`);
                                onClose();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Mail size={16} />
                            Send Email
                        </button>
                        <button
                            onClick={() => onOpen("EDIT_CUSTOMER", customer)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <Edit size={16} />
                            Edit Profile
                        </button>
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                setIsGenerating(true);
                                await generateAccountStatement(customer);
                                addToast('success', 'Account statement generated successfully!');
                            } catch (e: any) {
                                console.error(e);
                                addToast('error', 'Failed to generate account statement.');
                            } finally {
                                setIsGenerating(false);
                            }
                        }}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        {isGenerating ? 'Generating...' : 'Download Account Statement'}
                    </button>
                </div>
            </div>
        </Sheet>
    );
};
