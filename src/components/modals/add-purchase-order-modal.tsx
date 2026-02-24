"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useSuppliersStore, Supplier } from "@/store/suppliers-store";
import { useLocationsStore, Location } from "@/store/locations-store";
import { useInventoryStore } from "@/store/inventory-store";
import { usePurchaseOrdersStore } from "@/store/purchase-orders-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

export const AddPurchaseOrderModal = () => {
    const { isOpen, onClose, type } = useModal();
    const { suppliers, fetchSuppliers } = useSuppliersStore();
    const { locations, fetchLocations } = useLocationsStore();
    const { products, fetchProducts } = useInventoryStore();
    const { createPurchaseOrder, isLoading } = usePurchaseOrdersStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "ADD_PURCHASE_ORDER";

    const [supplierId, setSupplierId] = useState("");
    const [locationId, setLocationId] = useState("");
    const [expectedDate, setExpectedDate] = useState("");
    const [items, setItems] = useState<{ product_id: string; quantity: number; unit_cost: number }[]>([
        { product_id: "", quantity: 1, unit_cost: 0 }
    ]);

    useEffect(() => {
        if (isModalOpen) {
            fetchSuppliers();
            fetchLocations();
            fetchProducts();

            // Reset form
            setSupplierId("");
            setLocationId("");
            setExpectedDate("");
            setItems([{ product_id: "", quantity: 1, unit_cost: 0 }]);
        }
    }, [isModalOpen, fetchSuppliers, fetchLocations, fetchProducts]);

    const handleAddItem = () => {
        setItems([...items, { product_id: "", quantity: 1, unit_cost: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: "product_id" | "quantity" | "unit_cost", value: string | number) => {
        const newItems = [...items];

        // Auto-fill cost if product selected
        if (field === "product_id") {
            const product = products.find(p => p.id === value);
            if (product) {
                // Assuming we might have added cost_price earlier, but fallback to 0 or product.price * 0.5
                // The DB logic for cost check isn't strictly defined, so we just let user input or use a default.
                newItems[index] = { ...newItems[index], product_id: value as string, unit_cost: 0 };
            }
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }

        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!supplierId || !locationId) {
            addToast("error", "Please select a supplier and destination location");
            return;
        }

        const validItems = items.filter(i => i.product_id && i.quantity > 0 && i.unit_cost >= 0);
        if (validItems.length === 0) {
            addToast("error", "Please add at least one valid product line item");
            return;
        }

        try {
            // Generate a random PO number
            const poNumber = `PO-${Math.floor(100000 + Math.random() * 900000)}`;
            const total = calculateTotal();

            await createPurchaseOrder(
                {
                    po_number: poNumber,
                    supplier_id: supplierId,
                    location_id: locationId,
                    status: 'draft',
                    total_amount: total,
                    expected_date: expectedDate || null
                },
                validItems
            );

            addToast("success", "Purchase Order created successfully");
            onClose();
        } catch (error) {
            addToast("error", "Failed to create PO");
        }
    };

    return (
        <Modal
            title="Create Purchase Order"
            description="Initiate a stock order from a vendor to a specific location."
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Vendor / Supplier</label>
                        <select
                            required
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled>Select supplier...</option>
                            {suppliers.map((s: Supplier) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Destination Location</label>
                        <select
                            required
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled>Select destination...</option>
                            {locations.filter(l => l.is_active).map((loc: Location) => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Expected Delivery Date (Optional)</label>
                    <input
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Line Items</label>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                        >
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <select
                                            required
                                            value={item.product_id}
                                            onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="" disabled>Select Product...</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        disabled={items.length === 1}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1/2">
                                        <label className="text-xs text-slate-500 mb-1 block">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Qty"
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="text-xs text-slate-500 mb-1 block">Unit Cost ($)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={item.unit_cost}
                                            onChange={(e) => handleItemChange(index, "unit_cost", parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Price"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-medium text-slate-700">Estimated Total:</span>
                    <span className="text-lg font-bold text-slate-900">${calculateTotal().toFixed(2)}</span>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        ) : null}
                        Draft Order
                    </button>
                </div>
            </form>
        </Modal>
    );
};
