// modules/routes/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const RoutesPage = lazy(() => import("./pages/RoutesPage"));

export const routeRoutes: RouteConfig[] = [
    {
        path: "/routes",
        element: RoutesPage,
        roles: ["BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Route",
        label: "Routes",
        group: "operations",
        order: 1,
    },
];