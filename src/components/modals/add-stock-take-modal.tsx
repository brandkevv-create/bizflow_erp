"use client";

import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/use-modal-store";
import { useAuditsStore } from "@/store/audits-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useEffect, useState, useMemo } from "react";
import { Minus, Plus, Trash2, Search } from "lucide-react";

export const AddStockTakeModal = () => {
    const { isOpen, onClose, type } = useModal();
    const isModalOpen = isOpen && type === "NEW_AUDIT";

    const { createAdjustment, isLoading: isSaving } = useAuditsStore();
    const { locations, products } = useInventoryStore();

    const [locationId, setLocationId] = useState("");
    const [reason, setReason] = useState("shrinkage");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<{ productId: string, expected: number, actual: number }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (isModalOpen) {
            setLocationId("");
            setReason("initial_count");
            setNotes("");
            setItems([]);
            setSearchQuery("");
        }
    }, [isModalOpen]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const lowercaseQuery = searchQuery.toLowerCase();
        return products.filter(
            p => p.name.toLowerCase().includes(lowercaseQuery) ||
                p.sku.toLowerCase().includes(lowercaseQuery)
        );
    }, [products, searchQuery]);

    const handleAddItem = (productId: string) => {
        if (items.find(i => i.productId === productId)) return; // Already added
        // In a real multi-location setup, 'expected' should be fetched per location.
        // For now, we fallback to total stock as an approximation if specific location stock isn't in products array.
        const product = products.find(p => p.id === productId);
        setItems([{ productId, expected: product?.stock || 0, actual: 0 }, ...items]);
        setSearchQuery(""); // Clear search after adding
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (index: number, actualAmount: number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], actual: Math.max(0, actualAmount) };
        setItems(newItems);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!locationId) {
            alert("Please select a location");
            return;
        }

        if (items.length === 0) {
            alert("Please add at least one product to the stock take");
            return;
        }

        try {
            const adjustmentData = {
                reference_number: `SA-${Math.floor(1000 + Math.random() * 9000)}`,
                location_id: locationId,
                reason: reason as any,
                notes,
            };

            const adjustmentItems = items.map(i => ({
                product_id: i.productId,
                expected_quantity: i.expected,
                actual_quantity: i.actual
            }));

            await createAdjustment(adjustmentData, adjustmentItems);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to create stock adjustment. See console for details.");
        }
    };

    return (
        <Modal
            title="New Stock Take"
            description="Record physical inventory counts and generate an adjustment."
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Location</label>
                        <select
                            required
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Select Location...</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Audit Reason</label>
                        <select
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="initial_count">Initial Count</option>
                            <option value="shrinkage">Shrinkage / Loss</option>
                            <option value="damage">Damaged Goods</option>
                            <option value="found">Found / Discovered</option>
                            <option value="return">Customer Return</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Add Products to Audit</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products by name or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {searchQuery && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleAddItem(p.id)}
                                                disabled={items.some(i => i.productId === p.id)}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center justify-between disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                            >
                                                <span><span className="font-medium">{p.name}</span> <span className="text-slate-500 ml-2">({p.sku})</span></span>
                                                {items.some(i => i.productId === p.id) && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Added</span>}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-500 text-center">No products found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                            <ListChecks className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                            Find and select products above to begin counting.
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3 text-center">Expected (System)</th>
                                        <th className="px-4 py-3 w-40 text-center">Actual Count</th>
                                        <th className="px-4 py-3 text-center">Difference</th>
                                        <th className="px-4 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {items.map((item, index) => {
                                        const product = products.find(p => p.id === item.productId);
                                        const difference = item.actual - item.expected;

                                        return (
                                            <tr key={index}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{product?.name}</div>
                                                    <div className="text-xs text-slate-500">{product?.sku}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-500">
                                                    {item.expected}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center border border-slate-200 rounded-lg mx-auto bg-white overflow-hidden w-[100px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateItem(index, item.actual - 1)}
                                                            className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.actual}
                                                            onChange={(e) => handleUpdateItem(index, parseInt(e.target.value) || 0)}
                                                            className="w-12 py-1 text-center font-medium focus:outline-none focus:bg-blue-50"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateItem(index, item.actual + 1)}
                                                            className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex font-medium px-2 py-0.5 rounded text-xs ${difference > 0 ? 'text-emerald-700 bg-emerald-50' :
                                                        difference < 0 ? 'text-orange-700 bg-orange-50' :
                                                            'text-slate-500 bg-slate-50'
                                                        }`}>
                                                        {difference > 0 ? '+' : ''}{difference}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors inline-flex"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes & Findings</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        rows={2}
                        placeholder="Detail any specific findings, damages noticed, etc."
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || items.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? "Saving..." : "Save Draft Audit"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Simple icon for empty state
function ListChecks(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m3 17 2 2 4-4" />
            <path d="m3 7 2 2 4-4" />
            <path d="M13 6h8" />
            <path d="M13 12h8" />
            <path d="M13 18h8" />
        </svg>
    )
}
