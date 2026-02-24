"use client";

import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { AlertTriangle, Info } from "lucide-react";

export function ConfirmDialog() {
    const { isOpen, title, message, onConfirm, confirmText, cancelText, type, closeDialog } = useConfirmDialog();

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        closeDialog();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={closeDialog}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-start gap-4">
                    {type === 'danger' && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="text-red-600" size={20} />
                        </div>
                    )}
                    {type === 'warning' && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <AlertTriangle className="text-orange-600" size={20} />
                        </div>
                    )}
                    {type === 'info' && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Info className="text-blue-600" size={20} />
                        </div>
                    )}

                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                        <p className="text-sm text-slate-600">{message}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={closeDialog}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`
                            px-4 py-2 font-medium rounded-lg transition-colors
                            ${type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
                            ${type === 'warning' ? 'bg-orange-600 text-white hover:bg-orange-700' : ''}
                            ${type === 'info' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
