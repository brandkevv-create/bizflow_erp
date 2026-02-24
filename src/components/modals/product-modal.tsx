"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useInventoryStore, Product } from "@/store/inventory-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

export const ProductModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { products, addProduct, updateProduct } = useInventoryStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && (type === "ADD_PRODUCT" || type === "EDIT_PRODUCT");
    const isEditing = type === "EDIT_PRODUCT";

    // Form state
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [isKit, setIsKit] = useState(false);
    const [components, setComponents] = useState<{ component_id: string; quantity: number; name?: string }[]>([]);

    // Component Builder state
    const [selectedComponentId, setSelectedComponentId] = useState("");
    const [componentQuantity, setComponentQuantity] = useState("1");

    // Reset or populate form when modal opens
    useEffect(() => {
        if (isModalOpen) {
            if (isEditing && data) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setName(data.name || "");
                setSku(data.sku || "");
                setCategory(data.category || "");
                setPrice(data.price?.toString() || "");
                setStock(data.stock?.toString() || "");
                setIsKit(data.is_kit || false);
                setComponents(data.components || []);
            } else {
                setName("");
                setSku("");
                setCategory("");
                setPrice("");
                setStock("");
                setIsKit(false);
                setComponents([]);
            }
            setSelectedComponentId("");
            setComponentQuantity("1");
        }
    }, [isModalOpen, isEditing, data]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const stockNum = parseInt(stock);
        const priceNum = parseFloat(price);

        if (isEditing && data) {
            // Update existing product
            updateProduct(data.id, {
                name,
                sku,
                category,
                price: priceNum,
                stock: stockNum,
                is_kit: isKit,
                components: isKit ? components : [],
                status: stockNum === 0 && !isKit ? 'Out of Stock' : stockNum < 10 && !isKit ? 'Low Stock' : 'In Stock'
            });
            addToast('success', 'Product updated successfully');
        } else {
            // Add new product
            const newProduct = {
                name,
                sku,
                category,
                price: priceNum,
                stock: stockNum,
                cost: 0,
                is_kit: isKit,
                components: isKit ? components : []
            };
            addProduct(newProduct);
            addToast('success', 'Product added successfully');
        }

        onClose();
    };

    return (
        <Modal
            title={isEditing ? "Edit Product" : "Add New Product"}
            description={isEditing ? "Update product information" : "Add a new product to your inventory."}
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Product Name</label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Wireless Headphones"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">SKU</label>
                        <input
                            required
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. WH-001"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Electronics">Electronics</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Sports">Sports</option>
                            <option value="Home & Garden">Home & Garden</option>
                            <option value="Books">Books</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                    <input
                        type="checkbox"
                        id="isKitCheckbox"
                        checked={isKit}
                        onChange={(e) => setIsKit(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isKitCheckbox" className="text-sm font-medium text-slate-700">
                        Is this a Kit / Bundle?
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Price ($)</label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                    {!isKit && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Initial Stock</label>
                            <input
                                required
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>
                    )}
                </div>

                {isKit && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-900">Kit Components</h4>

                        {/* List current components */}
                        {components.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {components.map((c, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded border border-slate-200">
                                        <span><span className="font-semibold">{c.quantity}x</span> {c.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setComponents(components.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add new component builder */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Product</label>
                                <select
                                    value={selectedComponentId}
                                    onChange={(e) => setSelectedComponentId(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a product...</option>
                                    {products.filter(p => !p.is_kit && p.id !== data?.id).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-20 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={componentQuantity}
                                    onChange={(e) => setComponentQuantity(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (selectedComponentId && Number(componentQuantity) > 0) {
                                        const prod = products.find(p => p.id === selectedComponentId);
                                        if (prod) {
                                            if (components.find(c => c.component_id === selectedComponentId)) {
                                                addToast('error', 'Product is already a component');
                                                return;
                                            }
                                            setComponents([...components, { component_id: prod.id, quantity: Number(componentQuantity), name: prod.name }]);
                                            setSelectedComponentId("");
                                            setComponentQuantity("1");
                                        }
                                    }
                                }}
                                className="px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1 text-sm font-medium h-[34px]"
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                        Create Product
                    </button>
                </div>
            </form>
        </Modal>
    );
};
