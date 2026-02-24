import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TourProvider } from "@/components/providers/tour-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <TourProvider />
            {children}
        </DashboardLayout>
    );
}
