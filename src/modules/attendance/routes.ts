// modules/attendance/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const AttendancePage = lazy(() => import("./pages/AttendancePage"));

export const attendanceRoutes: RouteConfig[] = [
    {
        path: "/attendance",
        element: AttendancePage,
        roles: ["BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "ClipboardList",
        label: "Attendance",
        group: "operations",
        order: 3,
    },
];