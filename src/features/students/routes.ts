// src/features/students/routes.ts
//
// Route configuration for the Students module.
//
// Follows the same RouteConfig pattern used by every other module
// (matches routes/routes.ts exactly).

import { lazy }          from "react";
import type { RouteConfig } from "@/app/routes";

const StudentsListPage = lazy(() => import("./pages/StudentsListPage"));

export const studentRoutes: RouteConfig[] = [
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
];