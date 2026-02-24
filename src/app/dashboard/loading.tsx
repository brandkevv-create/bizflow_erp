export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-slate-500 font-medium">Loading Dashboard...</p>
            </div>
        </div>
    );
}
