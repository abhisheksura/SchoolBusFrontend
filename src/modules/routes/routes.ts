// modules/routes/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const StopsListPage = lazy(() => import("./pages/StopsListPage"));
const RoutesListPage = lazy(() => import("./pages/RoutesListPage"));

export const routeRoutes: RouteConfig[] = [
    {
        path: "/stops",
        element: StopsListPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "MapPin",
        label: "Stops",
        group: "operations",
        order: 1,
    },
    {
        path: "/routes",
        element: RoutesListPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Route",
        label: "Routes",
        group: "operations",
        order: 2,
    },
];