// src/app/routes/types.ts
// The RouteConfig contract every module's routes.ts must satisfy.
// AppRoutes reads this shape to build the route tree and sidebar nav.

import type { ComponentType } from "react";
import type { UserRole } from "@/features/auth/";

export interface RouteConfig {
    // ── Router fields ────────────────────────────────────────────────────────
    path: string;

    // The page component. Use React.lazy() in each module's routes.ts so
    // every page is code-split automatically.
    element: ComponentType;

    // Roles that may access this route.
    // SUPER_ADMIN bypasses this check in RoleGuard — no need to list it here.
    // Empty array means all authenticated users may access the route.
    roles: UserRole[];

    // ── Sidebar / Nav metadata ────────────────────────────────────────────────
    // Set showInSidebar: true for top-level nav entries.
    // Leave undefined / false for sub-pages (e.g. /schools/:id/branches).
    showInSidebar?: boolean;

    // Lucide icon name (string) resolved at render time.
    // Keeps this config file free of React JSX.
    icon?: SidebarIcon;

    // Display label in the sidebar. Required when showInSidebar is true.
    label?: string;

    // Nav group heading (e.g. "Fleet", "Operations") for visual grouping
    // in the sidebar. Items with the same group string are rendered together.
    group?: SidebarGroup;

    // Display order within a group. Lower = higher up.
    order?: number;
}

// ---------------------------------------------------------------------------
// Union types — keeps icon and group values discoverable and type-safe
// ---------------------------------------------------------------------------

export type SidebarIcon =
    | "LayoutDashboard"
    | "School"
    | "Building2"
    | "Bus"
    | "Users"
    | "MapPin"
    | "Route"
    | "Navigation"
    | "ClipboardList"
    | "Bell"
    | "Link"
    | "Cpu"
    | "UserCog"
    | "BarChart2";

export type SidebarGroup =
    | "overview"
    | "administration"
    | "fleet"
    | "operations"
    | "people"
    | "system";