"use client";

import { useToast } from "@/hooks/use-toast";
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from "lucide-react";

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
                        min-w-[300px] max-w-[400px] animate-slide-in
                        ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                        ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
                        ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
                        ${toast.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : ''}
                    `}
                >
                    {toast.type === 'success' && <CheckCircle size={20} className="text-green-600 flex-shrink-0" />}
                    {toast.type === 'error' && <AlertCircle size={20} className="text-red-600 flex-shrink-0" />}
                    {toast.type === 'info' && <Info size={20} className="text-blue-600 flex-shrink-0" />}
                    {toast.type === 'warning' && <AlertTriangle size={20} className="text-orange-600 flex-shrink-0" />}

                    <span className="flex-1 text-sm font-medium">{toast.message}</span>

                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
