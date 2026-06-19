// modules/routes/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/app/routes";

const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));

export const assignmentRoutes: RouteConfig[] = [
    {
        path: "/assignments",
        element: AssignmentsPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Link",
        label: "Assignments",
        group: "operations",
        order: 1,
    }
]