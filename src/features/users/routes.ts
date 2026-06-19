
import { lazy }          from "react";
import type { RouteConfig } from "@/app/routes";

const DriversListPage     = lazy(() => import("./pages/DriversListPage"));
const StudentsListPage    = lazy(() => import("./pages/StudentsListPage"));

export const userRoutes: RouteConfig[] = [
    {
        path: "/drivers",
        element: DriversListPage,

        // Both SCHOOL_ADMIN and BRANCH_ADMIN can access drivers.
        // SUPER_ADMIN is always allowed (bypassed in RoleGuard).
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "UserCog",
        label: "Drivers",
        group: "people",
        order: 0,
    },
    {
        path        : "/students",
        element     : StudentsListPage,
        roles       : ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon        : "Users",
        label       : "Students",
        group       : "people",
        order       : 1,
    },
        // Not in the sidebar — accessed by clicking a RouteCard.
    {
        path        : "/routes/:routeId/stops",
        element     : StudentsListPage,
        roles       : ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: false,
    },
];