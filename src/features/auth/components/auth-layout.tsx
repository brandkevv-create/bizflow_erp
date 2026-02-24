"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface AuthLayoutProps {
    children: ReactNode;
    heading: string;
    description: string;
    backButtonLabel?: string;
    backButtonHref?: string;
}

export function AuthLayout({
    children,
    heading,
    description,
    backButtonLabel,
    backButtonHref,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">BizFlow ERP</h1>
                        <h2 className="text-xl font-semibold text-slate-800">{heading}</h2>
                        <p className="text-sm text-slate-500 mt-2">{description}</p>
                    </div>
                    {children}
                    {backButtonLabel && backButtonHref && (
                        <div className="mt-6 text-center">
                            <Link
                                href={backButtonHref}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {backButtonLabel}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
