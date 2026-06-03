// ui/layouts/AdminLayout/Sidebar/Sidebar.tsx
// The main sidebar component.
//
// Features:
//   - Collapsible (icon-only) mode with smooth width transition
//   - Role-aware nav: only shows items the current user can access
//     (SUPER_ADMIN sees everything)
//   - Groups nav items by `group` metadata from route config
//   - Mobile overlay (drawer) mode
//   - User card at the bottom with logout

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bus, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { sidebarRoutes, GROUP_META } from "@/app/routes";
import type { RouteConfig, SidebarGroup } from "@/app/routes";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarUserCard from "./SidebarUserCard";

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    // Mobile: sidebar is open as an overlay
    mobileOpen: boolean;
    onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    collapsed,
    onToggleCollapse,
    mobileOpen,
    onMobileClose,
}) => {
    const { hasRole } = useAuth();

    // Filter routes the current user is allowed to see.
    // SUPER_ADMIN: all routes (hasRole("SUPER_ADMIN") → bypass in RoleGuard)
    // Others: routes where their role is listed, or routes with empty roles[]
    const visibleRoutes = useMemo<RouteConfig[]>(() => {
        if (hasRole("SUPER_ADMIN")) return sidebarRoutes;
        return sidebarRoutes.filter(
            (r) => r.roles.length === 0 || r.roles.some((role) => hasRole(role))
        );
    }, [hasRole]);

    // Group visible routes by their `group` field
    const grouped = useMemo(() => {
        const map = new Map<SidebarGroup, RouteConfig[]>();
        for (const route of visibleRoutes) {
            const g = route.group ?? "system";
            if (!map.has(g)) map.set(g, []);
            map.get(g)!.push(route);
        }
        // Sort groups by GROUP_META.order
        return [...map.entries()].sort(
            ([a], [b]) =>
                (GROUP_META[a]?.order ?? 99) - (GROUP_META[b]?.order ?? 99)
        );
    }, [visibleRoutes]);

    const sidebarContent = (
        <aside
            className={[
                "relative flex h-full flex-col bg-slate-900 transition-all duration-300 ease-in-out",
                collapsed ? "w-[60px]" : "w-[240px]",
            ].join(" ")}
        >
            {/* ── Top: Logo ─────────────────────────────────────────────── */}
            <div
                className={[
                    "flex h-16 shrink-0 items-center border-b border-slate-800",
                    collapsed ? "justify-center px-3" : "gap-2.5 px-5",
                ].join(" ")}
            >
                <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded-lg"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 shadow-md shadow-amber-500/30">
                        <Bus size={16} strokeWidth={2.5} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div className="leading-none">
                            <p className="text-sm font-bold text-white tracking-tight">
                                BusTracker
                            </p>
                            <p className="text-[10px] text-slate-500 tracking-wide uppercase mt-0.5">
                                Admin
                            </p>
                        </div>
                    )}
                </Link>
            </div>

            {/* ── Nav ───────────────────────────────────────────────────── */}
            <nav
                className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-none"
                aria-label="Main navigation"
            >
                <div className="flex flex-col gap-5">
                    {grouped.map(([group, routes]) => (
                        <SidebarNavGroup
                            key={group}
                            label={GROUP_META[group]?.label ?? group}
                            routes={routes}
                            collapsed={collapsed}
                        />
                    ))}
                </div>
            </nav>

            {/* ── Bottom: User card ─────────────────────────────────────── */}
            <div className="shrink-0 border-t border-slate-800 p-3">
                <SidebarUserCard collapsed={collapsed} />
            </div>

            {/* ── Collapse toggle button ────────────────────────────────── */}
            <button
                type="button"
                onClick={onToggleCollapse}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={[
                    "absolute -right-3 top-[72px] z-10",
                    "flex h-6 w-6 items-center justify-center",
                    "rounded-full border border-slate-700 bg-slate-800",
                    "text-slate-400 shadow-md",
                    "hover:border-amber-500/50 hover:bg-slate-700 hover:text-amber-400",
                    "transition-all duration-150",
                ].join(" ")}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {collapsed
                    ? <ChevronRight size={12} strokeWidth={2.5} />
                    : <ChevronLeft  size={12} strokeWidth={2.5} />
                }
            </button>
        </aside>
    );

    return (
        <>
            {/* ── Desktop sidebar ─────────────────────────────────────────── */}
            <div className="hidden lg:flex h-screen sticky top-0">
                {sidebarContent}
            </div>

            {/* ── Mobile overlay ──────────────────────────────────────────── */}
            {mobileOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={onMobileClose}
                        aria-hidden="true"
                    />
                    {/* Drawer */}
                    <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden">
                        {sidebarContent}
                    </div>
                </>
            )}
        </>
    );
};

export default Sidebar;