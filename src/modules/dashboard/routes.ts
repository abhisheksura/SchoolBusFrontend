// modules/dashboard/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));

export const dashboardRoutes: RouteConfig[] = [
    {
        path: "/dashboard",
        element: DashboardPage,
        roles: [],               // All authenticated roles
        showInSidebar: true,
        icon: "LayoutDashboard",
        label: "Dashboard",
        group: "overview",
        order: 0,
    },
];