// modules/notifications/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

export const notificationRoutes: RouteConfig[] = [
    {
        path: "/notifications",
        element: NotificationsPage,
        roles: ["BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Bell",
        label: "Notifications",
        group: "system",
        order: 0,
    },
];