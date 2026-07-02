
import { lazy } from "react";
import type { RouteConfig } from "@/app/routes";

const BusesListPage = lazy(() => import("./pages/BusesListPage"));

export const busRoutes: RouteConfig[] = [
    {
        path: "/buses",
        element: BusesListPage,
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Bus",
        label: "Buses",
        group: "fleet",
        order: 0,
    },
];
