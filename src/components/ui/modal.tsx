"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
    title: string;
    description: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
}

export const Modal = ({ title, description, isOpen, onClose, children, maxWidth = "max-w-lg" }: ModalProps) => {
    // Close on escape key
    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleDown);
        return () => window.removeEventListener("keydown", handleDown);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all animate-in fade-in duration-200">
            <div className={`bg-white rounded-lg shadow-xl w-full ${maxWidth} mx-4 overflow-hidden animate-in zoom-in-95 duration-200`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                        <p className="text-xs text-slate-500">{description}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
