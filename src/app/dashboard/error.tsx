"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Dashboard Error:", error);
    }, [error]);

    return (
        <div className="flex h-full w-full items-center justify-center min-h-[400px]">
            <div className="max-w-md w-full bg-white p-6 rounded-xl border border-red-100 shadow-sm text-center">
                <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="text-red-500" size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong!</h2>
                <p className="text-slate-500 text-sm mb-6">
                    {error.message || "An unexpected error occurred while loading this page."}
                </p>
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
