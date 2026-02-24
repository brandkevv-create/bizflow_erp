"use client";

import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useAuthStore } from "@/store/auth-store";
import { useRouter, usePathname } from "next/navigation";

export function TourProvider() {
    const { user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Only run for authenticated users the first time they visit the dashboard.
        if (typeof window !== "undefined" && user) {
            const hasSeenTour = localStorage.getItem(`has_seen_tour_${user.id}`);
            if (!hasSeenTour) {
                // Short delay to ensure DOM is fully loaded
                const timer = setTimeout(() => {
                    setRun(true);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, pathname]);

    const steps: Step[] = [
        {
            target: "body",
            placement: "center",
            title: "Welcome to BizFlow ERP! 👋",
            content: "Let's take a quick tour to help you get started with managing your business.",
            disableBeacon: true,
        },
        {
            target: "#tour-products-link",
            content: "Here you can manage your inventory, add new products, and track stock levels.",
            placement: "right",
        },
        {
            target: "#tour-point-of-sale-link",
            content: "Process customer transactions and create orders quickly at your register.",
            placement: "right",
        },
        {
            target: "#tour-orders-link",
            content: "Track order status, fulfillment, and review history.",
            placement: "right",
        },
        {
            target: "#tour-reports-link",
            content: "View powerful analytics and track your sales growth.",
            placement: "right",
        },
        {
            target: "#tour-settings-link",
            content: "And here you can configure your business profile, tax rates, and API keys. You're all set!",
            placement: "right",
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            if (user) {
                localStorage.setItem(`has_seen_tour_${user.id}`, "true");
            }
        }
    };

    if (!user || user.role !== 'admin') return null; // Only run tour for admins to keep it simple

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            run={run}
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={steps}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#2563eb', // text-blue-600
                    textColor: '#0f172a', // text-slate-900
                }
            }}
        />
    );
}
