import { useSettingsStore } from "@/store/settings-store";
import { CreditCard, Smartphone, ShoppingBag, Terminal, Eye, EyeOff, RefreshCw, Trash2, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useModal } from "@/hooks/use-modal-store";
import { useState } from "react";

export function IntegrationsTab() {
    const { integrations, toggleIntegration, apiKeys, createApiKey, deleteApiKey } = useSettingsStore();
    const { addToast } = useToast();
    const { onOpen } = useModal();
    const [showKeyId, setShowKeyId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
    const [newKeyName, setNewKeyName] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleToggle = async (id: string, name: string, status: string, iconType: string) => {
        await toggleIntegration(id, iconType);
        const newStatus = status === 'Connected' ? 'disconnected' : 'connected';
        addToast(newStatus === 'connected' ? 'success' : 'info', `${name} ${newStatus} successfully`);
    };

    const handleSync = async (provider: string, action: 'pull_inventory' | 'pull_orders') => {
        setIsSyncing(prev => ({ ...prev, [`${provider}-${action}`]: true }));
        try {
            const endpoint = provider === 'shopify' ? '/api/sync/shopify' : '/api/sync/woo';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();

            if (res.ok) {
                addToast('success', data.message || `Successfully synced ${action.replace('pull_', '')} with ${provider}`);
            } else {
                addToast('error', data.error || `Failed to sync with ${provider}`);
            }
        } catch (error) {
            console.error('Sync error:', error);
            addToast('error', 'Network error during sync operation');
        } finally {
            setIsSyncing(prev => ({ ...prev, [`${provider}-${action}`]: false }));
        }
    };

    const handleConfigure = (integration: any) => {
        onOpen('CONFIGURE_INTEGRATION', integration);
    };

    const handleGenerateKey = async () => {
        if (!newKeyName.trim()) {
            addToast('error', 'Please enter a name for the API key');
            return;
        }
        setIsGenerating(true);
        const result = await createApiKey(newKeyName.trim());
        if (result) {
            addToast('success', 'New API Key generated successfully');
            setNewKeyName("");
        } else {
            addToast('error', 'Failed to generate API Key');
        }
        setIsGenerating(false);
    };

    const handleDeleteKey = async (id: string) => {
        if (confirm("Are you sure you want to delete this API Key? Any application using it will lose access immediately.")) {
            await deleteApiKey(id);
            addToast('success', 'API Key deleted');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h3 className="font-semibold text-slate-900">Payment & Store Integrations</h3>
                    <p className="text-sm text-slate-500">Connect external platforms to sync data and process payments</p>
                </div>

                <div className="space-y-4">
                    {integrations.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColor(item.iconType)}`}>
                                    {getIcon(item.iconType)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        {item.status === 'Connected' && (
                                            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Connected</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>

                                    {/* Sync Actions for connected e-commerce stores */}
                                    {item.status === 'Connected' && (item.iconType === 'shopify' || item.iconType === 'woo') && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleSync(item.iconType, 'pull_inventory')}
                                                disabled={isSyncing[`${item.iconType}-pull_inventory`]}
                                                className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-50"
                                            >
                                                <RefreshCw size={12} className={isSyncing[`${item.iconType}-pull_inventory`] ? "animate-spin" : ""} />
                                                Sync Products
                                            </button>
                                            <button
                                                onClick={() => handleSync(item.iconType, 'pull_orders')}
                                                disabled={isSyncing[`${item.iconType}-pull_orders`]}
                                                className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded disabled:opacity-50"
                                            >
                                                <RefreshCw size={12} className={isSyncing[`${item.iconType}-pull_orders`] ? "animate-spin" : ""} />
                                                Sync Orders
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {item.status === 'Connected' ? (
                                    <>
                                        <button
                                            onClick={() => handleConfigure(item)}
                                            className="px-3 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-100 font-medium text-slate-700"
                                        >
                                            Configure
                                        </button>
                                        <button
                                            onClick={() => handleToggle(item.id, item.name, item.status, item.iconType)}
                                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded font-medium"
                                        >
                                            Disconnect
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleToggle(item.id, item.name, item.status, item.iconType)}
                                        className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h3 className="font-semibold text-slate-900">API Access</h3>
                    <p className="text-sm text-slate-500">Generate and manage API keys for custom integrations</p>
                </div>

                <div className="mb-6 flex gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">New API Key Name</label>
                        <input
                            type="text"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="e.g. Zapier Integration"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <button
                        onClick={handleGenerateKey}
                        disabled={isGenerating || !newKeyName.trim()}
                        className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 h-[38px]"
                    >
                        {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                        Create Key
                    </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Key Token</th>
                                <th className="px-4 py-3">Last Used</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {apiKeys.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                        No API keys generated yet.
                                    </td>
                                </tr>
                            ) : (
                                apiKeys.map((k) => (
                                    <tr key={k.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{k.name}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                                                    {showKeyId === k.id ? k.key : k.key.substring(0, 12) + '****************'}
                                                </code>
                                                <button
                                                    onClick={() => setShowKeyId(showKeyId === k.id ? null : k.id)}
                                                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                                    title={showKeyId === k.id ? "Hide key" : "Reveal key"}
                                                >
                                                    {showKeyId === k.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDeleteKey(k.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                title="Revoke and Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function getIcon(type: string) {
    switch (type) {
        case 'woo': return <ShoppingBag size={20} />;
        case 'shopify': return <ShoppingBag size={20} />;
        case 'mpesa': return <Smartphone size={20} />;
        case 'stripe': return <CreditCard size={20} />;
        case 'pos': return <Terminal size={20} />;
        default: return <ShoppingBag size={20} />;
    }
}

function getIconColor(type: string) {
    switch (type) {
        case 'woo': return 'bg-purple-100 text-purple-600';
        case 'shopify': return 'bg-green-100 text-green-600';
        case 'mpesa': return 'bg-red-100 text-red-600';
        case 'stripe': return 'bg-blue-100 text-blue-600';
        case 'pos': return 'bg-orange-100 text-orange-600';
        default: return 'bg-slate-100 text-slate-600';
    }
}
