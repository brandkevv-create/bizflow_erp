"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { useState } from "react";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const signUp = useAuthStore((state) => state.signUp);
    const devLogin = useAuthStore((state) => state.devLogin);
    const [error, setError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
    });



    const onSubmit = async (data: LoginValues) => {
        try {
            setError("");
            await login(data.email, data.password);
            router.push("/dashboard");
        } catch (err: any) {
            // If login fails, try to sign up automatically
            if (err.message === "Invalid login credentials") {
                try {
                    const result = await signUp(data.email, data.password);
                    if (result.user && !result.session) {
                        setError("Account created! Please confirm your email before logging in.");
                    } else {
                        // Success - Redirect
                        router.push("/dashboard");
                    }
                } catch (signUpErr: any) {
                    // If sign up fails too (e.g. user exists but wrong password, or rate limit)
                    setError(signUpErr.message || "Authentication failed");
                }
            } else {
                setError(err.message || "Invalid email or password");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                    {...register("email")}
                    type="email"
                    className={cn(
                        "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        errors.email && "border-red-500 focus:ring-red-500"
                    )}
                    placeholder="admin@example.com"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <input
                    {...register("password")}
                    type="password"
                    className={cn(
                        "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        errors.password && "border-red-500 focus:ring-red-500"
                    )}
                    placeholder="••••••••"
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 text-slate-500">Or continue with</span>
                </div>
            </div>
            <button
                type="button"
                onClick={() => {
                    devLogin();
                    router.push("/dashboard");
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
                Dev Access (Bypass Auth)
            </button>
        </form>
    );
}
