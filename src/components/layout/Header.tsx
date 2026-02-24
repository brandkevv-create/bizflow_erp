import { cn } from "@/lib/utils";
import { Menu, Search } from "lucide-react";
import { NotificationsDropdown } from "./notifications-dropdown";

interface HeaderProps {
    onMenuClick?: () => void;
    className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
    return (
        <header className={cn("h-16 border-b bg-white flex items-center justify-between px-6", className)}>
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-slate-100 rounded-md"
                >
                    <Menu size={20} />
                </button>
                <div className="hidden md:flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm w-48"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationsDropdown />
            </div>
        </header>
    );
}
