"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useSettingsStore } from "@/store/settings-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const TeamMemberModal = () => {
    const { isOpen, onClose, type, data } = useModal();
    const { addTeamMember, updateTeamMember } = useSettingsStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && (type === "ADD_TEAM_MEMBER" || type === "EDIT_TEAM_MEMBER");
    const isEdit = type === "EDIT_TEAM_MEMBER";

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        role: 'cashier',
        status: 'Active'
    });

    useEffect(() => {
        if (isModalOpen) {
            if (isEdit && data) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setForm({
                    full_name: data.full_name,
                    email: data.email,
                    role: data.role,
                    status: data.status
                });
            } else {
                setForm({
                    full_name: '',
                    email: '',
                    role: 'cashier',
                    status: 'Active'
                });
            }
        }
    }, [isModalOpen, isEdit, data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && data?.id) {
            // @ts-expect-error - Form type mismatch
            updateTeamMember(data.id, form);
            addToast('success', 'Team member updated successfully');
        } else {
            // @ts-expect-error - Form type mismatch
            addTeamMember(form);
            addToast('success', 'Team member invited successfully');
        }
        onClose();
    };

    return (
        <Modal
            title={isEdit ? "Edit Team Member" : "Invite Team Member"}
            description={isEdit ? "Update member details and permissions." : "Invite a new user to your team."}
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input
                        required
                        type="text"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. John Doe"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. john@example.com"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Role</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="cashier">Cashier</option>
                            <option value="warehouse">Warehouse</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

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
                        {isEdit ? "Save Changes" : "Send Invite"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
