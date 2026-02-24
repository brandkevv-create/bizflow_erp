"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useLocationsStore } from "@/store/locations-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const ManageLocationModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { addLocation, updateLocation } = useLocationsStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "MANAGE_LOCATION";
    const isEdit = !!data?.id;

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [locationType, setLocationType] = useState<"store" | "warehouse">("store");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (isModalOpen) {
            if (isEdit) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setName(data.name || "");
                setAddress(data.address || "");
                setLocationType(data.type || "store");
                setIsActive(data.is_active ?? true);
            } else {
                setName("");
                setAddress("");
                setLocationType("store");
                setIsActive(true);
            }
        }
    }, [isModalOpen, data, isEdit]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (isEdit) {
                await updateLocation(data.id, {
                    name,
                    address,
                    type: locationType,
                    is_active: isActive
                });
                addToast('success', 'Location updated successfully');
            } else {
                await addLocation({
                    name,
                    address,
                    type: locationType,
                    is_active: isActive
                });
                addToast('success', 'Location added successfully');
            }
            onClose();
        } catch (error) {
            // Error is handled in store, but we catch to prevent closing if needed
        }
    };

    return (
        <Modal
            title={isEdit ? "Edit Location" : "Add Location"}
            description={isEdit ? "Update details for this location." : "Create a new physical store or warehouse."}
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Location Name</label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Main Store, Downtown Warehouse..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Type</label>
                    <select
                        value={locationType}
                        onChange={(e) => setLocationType(e.target.value as "store" | "warehouse")}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="store">Storefront (Retail)</option>
                        <option value="warehouse">Warehouse (Storage)</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Address (Optional)</label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="123 Commerce St..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                        {isEdit ? "Save Changes" : "Create Location"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
