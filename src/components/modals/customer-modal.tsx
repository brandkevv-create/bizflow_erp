"use client";

import { useModal } from "@/hooks/use-modal-store";
import { Modal } from "@/components/ui/modal";
import { useCustomersStore } from "@/store/customers-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const CustomerModal = () => {
    const { isOpen, onClose, type } = useModal();
    const { addCustomer } = useCustomersStore();
    const { addToast } = useToast();

    const isModalOpen = isOpen && type === "ADD_CUSTOMER";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [taxId, setTaxId] = useState("");
    const [creditLimit, setCreditLimit] = useState("0");

    useEffect(() => {
        if (isModalOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName("");
            setEmail("");
            setPhone("");
            setCompanyName("");
            setTaxId("");
            setCreditLimit("0");
        }
    }, [isModalOpen]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newCustomer = {
            id: Math.random().toString(36).substr(2, 9),
            initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            name,
            email,
            phone,
            joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            ordersCount: 0,
            totalSpent: 0,
            lastOrderDate: 'N/A',
            status: 'Active' as const,
            company_name: companyName,
            tax_id: taxId,
            credit_limit: parseFloat(creditLimit) || 0
        };

        addCustomer(newCustomer);
        addToast('success', 'Customer added successfully');
        onClose();
    };

    return (
        <Modal
            title="Add New Customer"
            description="Add a new customer to your CRM."
            isOpen={isModalOpen}
            onClose={onClose}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="john@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 (555) 000-0000"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Company Name (B2B)</label>
                    <input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Company Ltd"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Tax ID</label>
                        <input
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="TAX-123456"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Credit Limit ($)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={creditLimit}
                            onChange={(e) => setCreditLimit(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                        Add Customer
                    </button>
                </div>
            </form>
        </Modal>
    )
}
