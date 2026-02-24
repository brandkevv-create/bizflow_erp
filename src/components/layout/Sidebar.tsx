"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    Box,
    CreditCard,
    LayoutDashboard,
    Settings,
    ShoppingCart,
    Users,
    ChevronDown,
    Store,
    RotateCcw
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { RoleGuard } from "@/components/auth/role-guard";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "manager"],
    },
    {
        title: "Point of Sale",
        href: "/dashboard/sales",
        icon: Store,
        roles: ["admin", "manager", "cashier"],
    },
    {
        title: "Returns (RMA)",
        href: "/dashboard/returns",
        icon: RotateCcw,
        roles: ["admin", "manager", "cashier"],
    },
    {
        title: "Products",
        href: "/dashboard/products",
        icon: Box,
        roles: ["admin", "manager", "cashier", "warehouse"],
    },
    {
        title: "Orders",
        href: "/dashboard/orders",
        icon: ShoppingCart,
        roles: ["admin", "manager", "cashier"],
    },
    {
        title: "Inventory",
        href: "/dashboard/inventory",
        icon: Box,
        roles: ["admin", "manager", "warehouse"],
    },
    {
        title: "Customers",
        href: "/dashboard/customers",
        icon: Users,
        roles: ["admin", "manager", "cashier"],
    },
    {
        title: "Finance",
        href: "/dashboard/finance",
        icon: CreditCard,
        roles: ["admin", "manager"],
    },
    {
        title: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        roles: ["admin", "manager"],
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["admin"],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
            {/* Brand */}
            <div className="p-6">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <LayoutDashboard className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-bold text-slate-900">BizFlow ERP</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                        <RoleGuard key={item.href} allowedRoles={item.roles as any}>
                            <Link
                                id={`tour-${item.title.toLowerCase().replace(/\s+/g, '-')}-link`}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                {item.title}
                            </Link>
                        </RoleGuard>
                    );
                })}
            </div>

            <div className="p-4 border-t border-slate-200 relative">
                {isDropdownOpen && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <div className="px-4 py-2 text-xs font-semibold text-slate-500">
                            My Account
                        </div>
                        <RoleGuard allowedRoles={["admin", "manager", "cashier", "warehouse"]}>
                            <Link
                                href="/dashboard/settings"
                                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                Profile
                            </Link>
                        </RoleGuard>
                        <RoleGuard allowedRoles={["admin"]}>
                            <Link
                                href="/dashboard/settings"
                                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                Team Settings
                            </Link>
                        </RoleGuard>
                        <RoleGuard allowedRoles={["admin", "manager"]}>
                            <Link
                                href="/dashboard/finance"
                                className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                Billing
                            </Link>
                        </RoleGuard>
                        <div className="my-1 border-t border-slate-100"></div>
                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                logout();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            Log out
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 px-2 w-full text-left hover:bg-slate-50 p-2 rounded-lg transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                        {user?.full_name?.substring(0, 2).toUpperCase() || "JD"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name || "John Doe"}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{user?.role || "Admin"}</p>
                    </div>
                    <div className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} />
                    </div>
                </button>
            </div>
        </div>
    );
}
