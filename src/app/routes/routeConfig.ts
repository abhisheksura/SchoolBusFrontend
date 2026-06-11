// app/routes/routeConfig.ts
// Single source of truth for every protected route in the app.
// AppRoutes and the Sidebar both consume this — one config drives both.
//
// To add a new module:
//   1. Create modules/<name>/routes.ts
//   2. Import and spread it here — nothing else needs to change.

import { dashboardRoutes }    from "@/modules/dashboard/routes";
import { busRoutes }          from "@/modules/buses/routes";
import { userRoutes }         from "@/modules/users/routes";
import { schoolRoutes }       from "@/modules/schools/routes";
import { routeRoutes }        from "@/features/routes/routes";

/*import { trackingRoutes }     from "@/modules/tracking/routes";
import { attendanceRoutes }   from "@/modules/attendance/routes";
import { notificationRoutes } from "@/modules/notifications/routes";
*/
import type { RouteConfig, SidebarGroup } from "./types";

// ---------------------------------------------------------------------------
// All protected routes — order here doesn't matter; sidebar uses `order`
// ---------------------------------------------------------------------------

export const allRoutes: RouteConfig[] = [
    ...dashboardRoutes,
    ...busRoutes,
    ...userRoutes,
    ...schoolRoutes,
    ...routeRoutes,

/*  
    ...trackingRoutes,
    ...attendanceRoutes,
    ...notificationRoutes,
*/
];

// ---------------------------------------------------------------------------
// Sidebar nav items — only routes with showInSidebar: true
// ---------------------------------------------------------------------------

export const sidebarRoutes: RouteConfig[] = allRoutes
    .filter((r) => r.showInSidebar)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

// ---------------------------------------------------------------------------
// Group metadata — defines display labels and ordering for nav sections
// ---------------------------------------------------------------------------

export const GROUP_META: Record<SidebarGroup, { label: string; order: number }> = {
    overview:       { label: "Overview",        order: 0 },
    administration: { label: "Administration",  order: 1 },
    fleet:          { label: "Fleet",           order: 2 },
    operations:     { label: "Operations",      order: 3 },
    people:         { label: "People",          order: 4 },
    system:         { label: "System",          order: 5 },
};