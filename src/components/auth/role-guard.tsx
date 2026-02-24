"use client";

import { useAuthStore, User } from "@/store/auth-store";
import { ReactNode } from "react";

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: User["role"][];
    fallback?: ReactNode;
}

export const RoleGuard = ({ children, allowedRoles, fallback = null }: RoleGuardProps) => {
    const { user, isLoading } = useAuthStore();

    if (isLoading) return null;

    if (!user || !allowedRoles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
