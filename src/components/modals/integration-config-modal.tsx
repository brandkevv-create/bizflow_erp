"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useSettingsStore } from "@/store/settings-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const IntegrationConfigModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { updateIntegrationConfig } = useSettingsStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "CONFIGURE_INTEGRATION";

    // Generic config state
    const [config, setConfig] = useState({
        api_key: '',
        secret_key: '',
        shop_url: '',
    });

    useEffect(() => {
        if (isModalOpen && data?.config) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setConfig({
                api_key: (data.config.api_key as string) || '',
                secret_key: (data.config.secret_key as string) || '',
                shop_url: (data.config.shop_url as string) || '',
            });
        }
    }, [isModalOpen, data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (data?.id && data?.iconType) {
            try {
                await updateIntegrationConfig(data.id, data.iconType, config);
                addToast('success', `${data.name} configuration saved`);
                onClose();
            } catch (error) {
                addToast('error', 'Failed to save configuration');
            }
        }
    };

    if (!data) return null;

    // Determine fields based on ID or Name (Mock logic for now)
    const isPayment = data.iconType === 'stripe' || data.iconType === 'mpesa';

    return (
        <Modal
            title={`Configure ${data.name}`}
            description="Enter your API credentials to connect."
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        {isPayment ? 'Publishable Key / Consumer Key' : 'API Key'}
                    </label>
                    <input
                        type="password"
                        value={config.api_key}
                        onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="****************"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        {isPayment ? 'Secret Key / Consumer Secret' : 'API Secret'}
                    </label>
                    <input
                        type="password"
                        value={config.secret_key}
                        onChange={(e) => setConfig({ ...config, secret_key: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="****************"
                    />
                </div>

                {(!isPayment || data.iconType === 'mpesa') && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                            {data.iconType === 'mpesa' ? 'Till Number / Paybill | Passkey' : (data.iconType === 'shopify' || data.iconType === 'woo' ? 'Shop URL' : 'Webhook URL')}
                        </label>
                        <input
                            type="text"
                            value={config.shop_url}
                            onChange={(e) => setConfig({ ...config, shop_url: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder={data.iconType === 'mpesa' ? "174379|bfb279f9aa9..." : (data.iconType === 'shopify' || data.iconType === 'woo' ? "https://your-store.com" : "https://your-site.com/webhook")}
                        />
                        <p className="text-xs text-slate-500">
                            {data.iconType === 'mpesa' ? 'Enter shortcode, followed by a pipe "|", then the passkey. Leave passkey blank to use sandbox default.' : (data.iconType === 'shopify' || data.iconType === 'woo' ? "Your store's full URL." : "Copy this URL to your external platform settings.")}
                        </p>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                        Save Configuration
                    </button>
                </div>
            </form>
        </Modal>
    );
};
