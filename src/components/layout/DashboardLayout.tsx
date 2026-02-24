"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { usePathname, useRouter } from "next/navigation";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, isLoading } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (isLoading || !user) return;

        const role = user.role;
        const path = pathname || '';

        // Cashier restrictions
        if (role === 'cashier') {
            if (path.startsWith('/dashboard/finance') || path.startsWith('/dashboard/reports') || path.startsWith('/dashboard/settings') || path === '/dashboard') {
                router.replace('/dashboard/sales');
            }
        }

        // Warehouse restrictions
        if (role === 'warehouse') {
            if (!path.startsWith('/dashboard/products')) {
                router.replace('/dashboard/products');
            }
        }

        // Manager restrictions
        if (role === 'manager') {
            if (path.startsWith('/dashboard/settings')) {
                router.replace('/dashboard');
            }
        }

    }, [pathname, user, isLoading, router]);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Sidebar (Drawer) */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity",
                    isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <div
                    className={cn(
                        "absolute top-0 left-0 h-full w-64 bg-white shadow-xl transition-transform duration-300 transform",
                        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside sidebar
                >
                    <Sidebar />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
