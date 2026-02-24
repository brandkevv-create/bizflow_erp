"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useSuppliersStore } from "@/store/suppliers-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const ManageSupplierModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { addSupplier, updateSupplier, isLoading } = useSuppliersStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "MANAGE_SUPPLIER";
    const isEdit = !!data?.id;

    const [name, setName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    useEffect(() => {
        if (isModalOpen) {
            if (isEdit) {
                setName(data.name || "");
                setContactPerson(data.contact_person || "");
                setEmail(data.email || "");
                setPhone(data.phone || "");
                setAddress(data.address || "");
            } else {
                setName("");
                setContactPerson("");
                setEmail("");
                setPhone("");
                setAddress("");
            }
        }
    }, [isModalOpen, isEdit, data]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            addToast("error", "Supplier name is required");
            return;
        }

        try {
            const payload = {
                name: name.trim(),
                contact_person: contactPerson.trim() || null,
                email: email.trim() || null,
                phone: phone.trim() || null,
                address: address.trim() || null,
            };

            if (isEdit) {
                await updateSupplier(data.id, payload);
                addToast("success", "Supplier updated successfully");
            } else {
                await addSupplier(payload);
                addToast("success", "Supplier created successfully");
            }
            onClose();
        } catch (error) {
            addToast("error", `Failed to ${isEdit ? "update" : "create"} supplier`);
        }
    };

    return (
        <Modal
            title={isEdit ? "Edit Supplier" : "Add Supplier"}
            description={isEdit ? "Update vendor details." : "Add a new vendor to your registry."}
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Supplier Name <span className="text-red-500">*</span></label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Global Tech Distributors"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Contact Person</label>
                        <input
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Jane Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Phone</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="orders@vendor.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Physical Address</label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="123 Warehouse Blvd..."
                    />
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
                        {isEdit ? "Save Changes" : "Create Supplier"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
