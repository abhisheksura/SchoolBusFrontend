// ui/layouts/AdminLayout/Navbar/NavNotificationBell.tsx
// Notification bell with an unread count badge.
// Polls GET /notifications (every 30s) for unread count.
// Clicking navigates to /notifications.

import React from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";

interface NotificationItem {
    notification_id: number;
    notification_status: string;
}

function useUnreadCount() {
    return useQuery({
        queryKey: ["notifications", "unread-count"],
        queryFn: async () => {
            const { data } = await apiClient.get<PaginatedResponse<NotificationItem>>(
                "/notifications/my",
                { params: { status: "SENT", page: 1, page_size: 1 } }
            );
            return data.total;
        },
        refetchInterval: 30_000,
        staleTime: 15_000,
    });
}

const NavNotificationBell: React.FC = () => {
    const { data: unreadCount = 0 } = useUnreadCount();

    return (
        <Link
            to="/notifications"
            className={[
                "relative flex h-9 w-9 items-center justify-center rounded-lg",
                "text-slate-500 transition-colors",
                "hover:bg-slate-100 hover:text-slate-700",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
            ].join(" ")}
            title="Notifications"
            aria-label={
                unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : "Notifications"
            }
        >
            <Bell size={18} strokeWidth={1.75} />

            {unreadCount > 0 && (
                <span
                    className={[
                        "absolute -top-0.5 -right-0.5",
                        "flex h-4 min-w-4 items-center justify-center",
                        "rounded-full bg-amber-500 px-1",
                        "text-[10px] font-bold text-white leading-none",
                    ].join(" ")}
                    aria-hidden="true"
                >
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </Link>
    );
};

export default NavNotificationBell;