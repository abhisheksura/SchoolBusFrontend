// modules/users/routes.ts

// Route configuration for the Drivers module.
//
// Follows the same RouteConfig pattern used by every other module:
//   - lazy() wraps the page component for automatic code-splitting
//   - roles array controls access (SUPER_ADMIN bypasses via RoleGuard)
//   - showInSidebar: true adds the entry to the sidebar nav
//
// To wire this into the app, import `userRoutes` in
// src/app/routes/routeConfig.ts and spread it into `allRoutes`.

import { lazy } from "react";
import type { RouteConfig } from "@/core/types/routes";

/**
 * Lazy-loaded Drivers page.
 * The dynamic import means this chunk is only fetched when the user
 * navigates to /drivers — not on initial app load.
 */
const DriversListPage     = lazy(() => import("./pages/DriversListPage"));
// const StudentsPage    = lazy(() => import("./pages/StudentsPage"));
// const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));

/**
 * All routes exported by the users/drivers module.
 * Currently contains a single list route; a detail route is handled
 * via the in-page slide-over panel (no separate URL needed).
 */
export const userRoutes: RouteConfig[] = [
    {
        path: "/drivers",
        element: DriversListPage,

        // Both SCHOOL_ADMIN and BRANCH_ADMIN can access drivers.
        // SUPER_ADMIN is always allowed (bypassed in RoleGuard).
        roles: ["SCHOOL_ADMIN", "BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "UserCog",
        label: "Drivers",
        group: "people",
        order: 0,
    },
/*    {
        path: "/students",
        element: StudentsPage,
        roles: ["BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "Users",
        label: "Students",
        group: "people",
        order: 1,
    },
    {
        path: "/assignments",
        element: AssignmentsPage,
        roles: ["BRANCH_ADMIN"],
        showInSidebar: true,
        icon: "ClipboardList",
        label: "Assignments",
        group: "operations",
        order: 2,
    },
*/
];