// modules/routes/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/app/routes";

const StopsListPage = lazy(() => import("./pages/StopsListPage"));
const RoutesListPage = lazy(() => import("./pages/RoutesListPage"));
const RouteStopsPage = lazy(() => import("./pages/RouteStopsPage"));


export const routeRoutes: RouteConfig[] = [
    {
        path: "/stops",
        element: StopsListPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "MapPin",
        label: "Stops",
        group: "fleet",
        order: 1,
    },
    {
        path: "/routes",
        element: RoutesListPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Route",
        label: "Routes",
        group: "fleet",
        order: 2,
    },
    // ── Route detail (stops management) ─────────────────────────────────────
    // Not in the sidebar — accessed by clicking a RouteCard.
    {
        path        : "/routes/:routeId/stops",
        element     : RouteStopsPage,
        roles       : ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: false,
    },
];