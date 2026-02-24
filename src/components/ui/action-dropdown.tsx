"use client";

import { useState, useRef, useEffect } from "react";
import { Edit, Mail, MoreVertical, Trash2, Settings } from "lucide-react";

interface ActionDropdownProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    onSendEmail?: () => void;
    onCustomAction?: () => void;
    customActionLabel?: string;
    customActionIcon?: React.ElementType;
}

export function ActionDropdown({
    onEdit,
    onDelete,
    onView,
    onSendEmail,
    onCustomAction,
    customActionLabel,
    customActionIcon: CustomActionIcon
}: ActionDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                title="Actions"
            >
                <MoreVertical size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                    {onCustomAction && (
                        // Replaced DropdownMenuItem with a button to match existing component structure
                        // and avoid undefined component error, while keeping the requested content.
                        <button
                            onClick={() => { onCustomAction(); setIsOpen(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            {CustomActionIcon ? <CustomActionIcon size={16} className="text-slate-500" /> : <Settings size={16} className="text-slate-500" />}
                            {customActionLabel || "Action"}
                        </button>
                    )}
                    {onView && (
                        <button
                            onClick={() => { onView(); setIsOpen(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            View Details
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={() => { onEdit(); setIsOpen(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <Edit size={16} className="text-slate-500" />
                            Edit
                        </button>
                    )}
                    {onSendEmail && (
                        <button
                            onClick={() => { onSendEmail(); setIsOpen(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <Mail size={16} className="text-slate-500" />
                            Send Email
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => { onDelete(); setIsOpen(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
