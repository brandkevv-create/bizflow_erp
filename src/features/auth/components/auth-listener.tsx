"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";

export function AuthListener() {
    const checkSession = useAuthStore((state) => state.checkSession);

    useEffect(() => {
        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                checkSession();
            } else if (event === 'SIGNED_OUT') {
                checkSession();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [checkSession]);

    return null;
}
