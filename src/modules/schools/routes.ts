// modules/buses/routes.ts

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

const SchoolsListPage = lazy(() => import("./pages/SchoolsListPage"));
const SchoolDetailsPage = lazy(() => import("./pages/SchoolDetailsPage"));
const BranchesPage = lazy(() => import("./pages/BranchesListPage"));

export const schoolRoutes: RouteConfig[] = [
    {
        path: "/schools",
        element: SchoolsListPage,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN"],
        showInSidebar: true,
        icon: "School",
        label: "Schools",
        group: "administration",
        order: 0,
    },
    {
        path: "/schools/:schoolId",
        element: SchoolDetailsPage,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN"],
    },
    /*{
        path: "/branches",
        element: BranchesPage,
        roles: ["SUPER_ADMIN", "SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Building2",
        label: "Branches",
        group: "administration",
        order: 1,
    },*/
];