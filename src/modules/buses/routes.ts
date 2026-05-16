// modules/buses/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const BusesPage = lazy(() => import("./pages/BusesPage"));

export const busRoutes: RouteConfig[] = [
    {
        path: "/fleet/buses",
        element: BusesPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Bus",
        label: "Buses",
        group: "fleet",
        order: 0,
    },
];