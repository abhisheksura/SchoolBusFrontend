// modules/dashboard/pages/DashboardPage.tsx

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Bus,
    Navigation,
    Users,
    CalendarOff,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Bell,
} from "lucide-react";
import { useAuth } from "@/modules/auth/context";
import { getDashboardStats, getTodayTrips, getRecentNotifications } from "../api";
import type { DashboardStats } from "../types";
import { formatRelative, formatTime } from "@/core/utils/formatters";
import {
    TRIP_STATUS_COLORS,
    TRIP_STATUS_LABELS,
    TRIP_TYPE_LABELS,
} from "@/features/trips";

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconBg, trend }) => (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="mt-0.5 text-2xl font-bold text-slate-800 leading-none">{value}</p>
            {trend && (
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <TrendingUp size={11} />
                    {trend}
                </p>
            )}
        </div>
    </div>
);

const StatCardSkeleton: React.FC = () => (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
        <div className="h-12 w-12 rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-7 w-16 rounded bg-slate-100" />
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Trip status icon
// ---------------------------------------------------------------------------

const TripStatusIcon: React.FC<{ status: string }> = ({ status }) => {
    const icons: Record<string, React.ReactNode> = {
        SCHEDULED:   <Clock      size={14} className="text-blue-500" />,
        IN_PROGRESS: <Navigation size={14} className="text-green-500" />,
        COMPLETED:   <CheckCircle2 size={14} className="text-slate-400" />,
        CANCELLED:   <XCircle    size={14} className="text-red-400" />,
    };
    return <>{icons[status] ?? <AlertCircle size={14} className="text-slate-400" />}</>;
};

// ---------------------------------------------------------------------------
// Notification type badge color
// ---------------------------------------------------------------------------

const NOTIF_TYPE_COLORS: Record<string, string> = {
    ATTENDANCE:  "bg-blue-100 text-blue-700",
    TRIP_START:  "bg-green-100 text-green-700",
    TRIP_END:    "bg-slate-100 text-slate-600",
    DELAY:       "bg-amber-100 text-amber-700",
    GENERAL:     "bg-purple-100 text-purple-700",
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const DashboardPage: React.FC = () => {
    const { user, getSchoolIds, getBranchIds } = useAuth();
    const schoolIds = getSchoolIds();
    const school_id = schoolIds[0];
    const branchIds = school_id ? getBranchIds(school_id) : [];
    const branch_id = branchIds[0];

    // Stats
    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ["dashboard", "stats", { school_id, branch_id }],
        queryFn: () => getDashboardStats(),
        staleTime: 60_000,
    });

    // Today's trips
    const { data: trips = [], isLoading: tripsLoading } = useQuery({
        queryKey: ["dashboard", "trips-today", { school_id, branch_id }],
        queryFn: () => getTodayTrips({ school_id, branch_id }),
        staleTime: 30_000,
    });

    // Recent notifications
    const { data: notifData, isLoading: notifLoading } = useQuery({
        queryKey: ["dashboard", "notifications"],
        queryFn: () => getRecentNotifications({ page: 1, page_size: 5 }),
        staleTime: 30_000,
    });
    const notifications = notifData?.items ?? [];

    const statCards = [
        {
            label: "Total Buses",
            value: stats?.total_buses ?? 0,
            icon: <Bus size={22} strokeWidth={1.75} className="text-amber-600" />,
            iconBg: "bg-amber-50",
            trend: "Fleet registered",
        },
        {
            label: "Active Trips Today",
            value: stats?.active_trips_today ?? 0,
            icon: <Navigation size={22} strokeWidth={1.75} className="text-green-600" />,
            iconBg: "bg-green-50",
            trend: "Currently in progress",
        },
        {
            label: "Total Students",
            value: stats?.total_students ?? 0,
            icon: <Users size={22} strokeWidth={1.75} className="text-blue-600" />,
            iconBg: "bg-blue-50",
            trend: "Enrolled & active",
        },
        {
            label: "Pending Leaves",
            value: stats?.pending_leaves ?? 0,
            icon: <CalendarOff size={22} strokeWidth={1.75} className="text-rose-600" />,
            iconBg: "bg-rose-50",
            trend: "Awaiting approval",
        },
    ];

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">

            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                    Good {getGreeting()},{" "}
                    <span className="text-amber-500">{user?.user_name}</span>
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                    Here's what's happening with your fleet today.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statsLoading
                    ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                    : statCards.map((card) => <StatCard key={card.label} {...card} />)
                }
            </div>

            {/* Bottom grid: trips + notifications */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

                {/* Today's trips — 3 cols */}
                <div className="lg:col-span-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700">
                            Today's Trips
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            {trips.length} total
                        </span>
                    </div>

                    {tripsLoading ? (
                        <TripListSkeleton />
                    ) : trips.length === 0 ? (
                        <EmptyState
                            icon={<Navigation size={28} className="text-slate-300" />}
                            message="No trips scheduled for today"
                        />
                    ) : (
                        <div className="flex flex-col divide-y divide-slate-100">
                            {trips.map((trip) => (
                                <div key={trip.trip_id} className="flex items-center gap-3 py-3">
                                    <TripStatusIcon status={trip.trip_status} />

                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-700">
                                            {trip.route_name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {TRIP_TYPE_LABELS[trip.trip_type]} &middot; {trip.bus_number ?? "No bus"} &middot; {trip.driver_name ?? "No driver"}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TRIP_STATUS_COLORS[trip.trip_status]}`}>
                                            {TRIP_STATUS_LABELS[trip.trip_status]}
                                        </span>
                                        {trip.actual_start_time && (
                                            <span className="text-[11px] text-slate-400">
                                                {formatTime(trip.actual_start_time)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent notifications — 2 cols */}
                <div className="lg:col-span-2 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700">
                            Recent Notifications
                        </h2>
                        <Bell size={14} className="text-slate-400" />
                    </div>

                    {notifLoading ? (
                        <NotifListSkeleton />
                    ) : notifications.length === 0 ? (
                        <EmptyState
                            icon={<Bell size={28} className="text-slate-300" />}
                            message="No recent notifications"
                        />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {notifications.map((n) => (
                                <div
                                    key={n.notification_id}
                                    className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
                                >
                                    <span
                                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${NOTIF_TYPE_COLORS[n.notification_type] ?? "bg-slate-100 text-slate-600"}`}
                                    >
                                        {n.notification_type.replace("_", " ")}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-xs font-semibold text-slate-700">
                                            {n.title}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                            {n.message}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            {formatRelative(n.sent_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
}

const EmptyState: React.FC<{ icon: React.ReactNode; message: string }> = ({
    icon,
    message,
}) => (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
        {icon}
        <p className="text-sm text-slate-400">{message}</p>
    </div>
);

const TripListSkeleton: React.FC = () => (
    <div className="flex flex-col divide-y divide-slate-100 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-4 w-4 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="h-5 w-20 rounded-full bg-slate-100" />
            </div>
        ))}
    </div>
);

const NotifListSkeleton: React.FC = () => (
    <div className="flex flex-col gap-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="h-5 w-16 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-2.5 w-1/3 rounded bg-slate-100" />
                </div>
            </div>
        ))}
    </div>
);

export default DashboardPage;