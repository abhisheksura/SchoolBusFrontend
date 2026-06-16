// src/features/students/routes.ts
//
// Route configuration for the Students module.
//
// Follows the same RouteConfig pattern used by every other module
// (matches routes/routes.ts exactly).

import { lazy }          from "react";
import type { RouteConfig } from "@/app/routes";

const TripsListPage = lazy(() => import("./pages/TripsListPage"));

export const tripRoutes: RouteConfig[] = [
    {
        path        : "/trips",
        element     : TripsListPage,
        roles       : ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon        : "Navigation",
        label       : "Trips",
        group       : "operations",
        order       : 2,
    },
];