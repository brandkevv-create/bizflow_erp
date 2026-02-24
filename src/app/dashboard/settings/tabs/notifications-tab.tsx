"use client";

import { useSettingsStore } from "@/store/settings-store";
import { Mail, Smartphone } from "lucide-react";

export function NotificationsTab() {
    const { notifications, toggleNotification } = useSettingsStore();
    // const { addToast } = useToast();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const handleToggle = (key: any, label: string) => {
        toggleNotification(key);
        // Optional: reduce toast noise, maybe only show on important changes or just rely on visual switch
        // addToast('default', `${label} preferences updated`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h3 className="font-semibold text-slate-900">Email Notifications</h3>
                    <p className="text-sm text-slate-500">Choose which notifications you want to receive</p>
                </div>

                <div className="space-y-6">
                    <ToggleRow
                        label="Order Notifications"
                        desc="Receive alerts when new orders are placed"
                        checked={notifications.order}
                        onChange={() => handleToggle('order', 'Orders')}
                    />
                    <ToggleRow
                        label="Low Stock Alerts"
                        desc="Get notified when products are running low"
                        checked={notifications.stock}
                        onChange={() => handleToggle('stock', 'Stock')}
                    />
                    <ToggleRow
                        label="Customer Messages"
                        desc="Notifications for customer inquires and messages"
                        checked={notifications.messages}
                        onChange={() => handleToggle('messages', 'Messages')}
                    />
                    <ToggleRow
                        label="Weekly Reports"
                        desc="Receive a summary of your business performance every week"
                        checked={notifications.reports}
                        onChange={() => handleToggle('reports', 'Reports')}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h3 className="font-semibold text-slate-900">Notification Channels</h3>
                    <p className="text-sm text-slate-500">Configure how you receive notifications</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-blue-200 bg-blue-50/30 rounded-lg flex items-start gap-4 cursor-pointer relative">
                        <div className="absolute top-4 right-4 w-4 h-4 bg-blue-600 rounded-full border-[3px] border-white ring-1 ring-blue-200"></div>
                        <div className="mt-1 text-blue-600">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">Email</p>
                            <p className="text-xs text-slate-500 mt-1">Send notifications to your email address</p>
                        </div>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-lg flex items-start gap-4 opacity-60 cursor-not-allowed">
                        <div className="mt-1 text-slate-400">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900">SMS</p>
                            <p className="text-xs text-slate-500 mt-1">Coming soon - SMS notifications</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ToggleRow({ label, desc, checked, onChange }: any) {
    return (
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 last:border-0 last:pb-0">
            <div>
                <p className="font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
    )
}
