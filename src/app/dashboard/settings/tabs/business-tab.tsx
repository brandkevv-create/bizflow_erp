"use client";

import { useSettingsStore } from "@/store/settings-store";
import { Building2, Save } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function BusinessTab() {
    const { business, updateBusiness, fetchSettings } = useSettingsStore();
    const { addToast } = useToast();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Local state for form
    const [formData, setFormData] = useState(business);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync local state when store changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(business);
        setHasChanges(false);
    }, [business]);

    // Check for changes
    useEffect(() => {
        const isChanged = JSON.stringify(formData) !== JSON.stringify(business);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasChanges(isChanged);
    }, [formData, business]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setFormData(prev => ({ ...prev, logo: undefined }));
    };

    const handleSave = () => {
        updateBusiness(formData);
        addToast('success', 'Business settings updated successfully');
        setHasChanges(false);
    };

    const handleCancel = () => {
        setFormData(business);
        setHasChanges(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-semibold text-slate-900">Business Profile</h3>
                        <p className="text-sm text-slate-500">Manage your company information and branding</p>
                    </div>
                    {hasChanges && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                            >
                                <Save size={16} />
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Section */}
                    <div className="md:col-span-2 flex items-center gap-6 p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                        <div className="w-20 h-20 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                            {formData.logo ? (
                                <div className="relative w-full h-full">
                                    <Image src={formData.logo} alt="Logo" fill className="object-contain" unoptimized />
                                </div>
                            ) : (
                                <Building2 size={32} className="text-slate-300" />
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900">Company Logo</h4>
                            <p className="text-xs text-slate-500 mb-3">Upload your business logo to appear on invoices.</p>
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium hover:bg-slate-50 text-slate-700 transition-colors shadow-sm">
                                    Upload New Logo
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </label>
                                {formData.logo && (
                                    <button
                                        onClick={handleRemoveLogo}
                                        className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1"
                                    >
                                        Remove Logo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Business Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            readOnly
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Timezone</label>
                        <select
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option>Pacific Time (PST)</option>
                            <option>Eastern Time (EST)</option>
                            <option>UTC</option>
                            <option>East Africa Time (EAT)</option>
                        </select>
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Business Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Business Description</label>
                        <textarea
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="mb-6">
                    <h3 className="font-semibold text-slate-900">Tax & Currency Settings</h3>
                    <p className="text-sm text-slate-500">Configure tax rates and currency preferences</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Currency</label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                            <option value="KES">KES - Kenyan Shilling</option>
                            <option value="ZAR">ZAR - South African Rand</option>
                            <option value="INR">INR - Indian Rupee</option>
                            <option value="CNY">CNY - Chinese Yuan</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Default Tax Rate (%)</label>
                        <input
                            type="number"
                            name="taxRate"
                            min="0"
                            step="0.01"
                            value={formData.taxRate}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onChange={(e) => handleChange({ ...e, target: { ...e.target, value: parseFloat(e.target.value) || 0, name: 'taxRate' } as any })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
