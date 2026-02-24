
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

interface StatusOption {
    value: string;
    label: string;
    color?: string; // Tailwind class for text/bg
}

interface StatusDropdownProps {
    currentStatus: string;
    options: StatusOption[];
    onSelect: (value: string) => Promise<void> | void;
    isLoading?: boolean;
    className?: string;
}

export function StatusDropdown({
    currentStatus,
    options,
    onSelect,
    isLoading = false,
    className = ""
}: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentOption = options.find(o => o.value === currentStatus) || {
        value: currentStatus,
        label: currentStatus,
        color: "bg-slate-100 text-slate-700 border-slate-200"
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (value: string) => {
        if (value === currentStatus) {
            setIsOpen(false);
            return;
        }

        setIsUpdating(true);
        try {
            await onSelect(value);
        } finally {
            setIsUpdating(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                disabled={isLoading || isUpdating}
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${currentOption.color} ${className} ${(isLoading || isUpdating) ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:opacity-80'}`}
            >
                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : currentOption.label}
                <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="py-1" role="menu">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors
                                    ${option.value === currentStatus ? 'font-medium text-slate-900 bg-slate-50' : 'text-slate-700'}
                                `}
                                role="menuitem"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
