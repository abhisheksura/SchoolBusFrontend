// modules/tracking/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const GpsDevicesPage = lazy(() => import("./pages/GpsDevicesPage"));
const TripsPage      = lazy(() => import("./pages/TripsPage"));

export const trackingRoutes: RouteConfig[] = [
    {
        path: "/gps/devices",
        element: GpsDevicesPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Cpu",
        label: "GPS Devices",
        group: "fleet",
        order: 1,
    },
    {
        path: "/trips",
        element: TripsPage,
        roles: ["BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Navigation",
        label: "Trips",
        group: "operations",
        order: 0,
    },
];