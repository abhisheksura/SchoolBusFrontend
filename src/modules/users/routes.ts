// modules/users/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const DriversPage     = lazy(() => import("./pages/DriversPage"));
const StudentsPage    = lazy(() => import("./pages/StudentsPage"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));

export const userRoutes: RouteConfig[] = [
    {
        path: "/drivers",
        element: DriversPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "UserCog",
        label: "Drivers",
        group: "people",
        order: 0,
    },
    {
        path: "/students",
        element: StudentsPage,
        roles: ["BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Users",
        label: "Students",
        group: "people",
        order: 1,
    },
    {
        path: "/assignments",
        element: AssignmentsPage,
        roles: ["BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "ClipboardList",
        label: "Assignments",
        group: "operations",
        order: 2,
    },
];