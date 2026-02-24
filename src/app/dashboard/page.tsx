"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard-store";
import { DashboardStats } from "@/features/dashboard/components/dashboard-stats";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { FinanceOverview } from "@/features/dashboard/components/finance-overview";

export default function DashboardPage() {
    const { fetchDashboardData } = useDashboardStore();
    const router = useRouter();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Welcome back! Here&apos;s what&apos;s happening with your business today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push('/dashboard/reports')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <DashboardStats />

            {/* Finance Overview */}
            <FinanceOverview />

            {/* Charts Section */}
            <DashboardCharts />

            {/* Activity Feed */}
            <RecentActivity />
        </div>
    );
}
