// ui/layouts/AdminLayout/Sidebar/SidebarNavItem.tsx
// Single navigation link in the sidebar.
// Handles active state via NavLink, shows icon + label, and collapses
// to icon-only when the sidebar is collapsed.

import React from "react";
import { NavLink } from "react-router-dom";
import SidebarIcon from "./SidebarIcon";
import type { RouteConfig } from "@/core/types/routes";

interface SidebarNavItemProps {
    route: RouteConfig;
    collapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ route, collapsed }) => {
    if (!route.icon || !route.label) return null;

    return (
        <NavLink
            to={route.path}
            title={collapsed ? route.label : undefined}
            className={({ isActive }) =>
                [
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-sm font-medium transition-all duration-150 outline-none",
                    "focus-visible:ring-2 focus-visible:ring-amber-500/50",
                    isActive
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                    collapsed ? "justify-center px-2.5" : "",
                ].join(" ")
            }
        >
            {({ isActive }) => (
                <>
                    <SidebarIcon
                        name={route.icon!}
                        size={18}
                        strokeWidth={isActive ? 2.25 : 1.75}
                        className="shrink-0"
                    />

                    {/* Label — hidden when collapsed */}
                    {!collapsed && (
                        <span className="truncate leading-none">{route.label}</span>
                    )}

                    {/* Tooltip on hover when collapsed */}
                    {collapsed && (
                        <span
                            className={[
                                "pointer-events-none absolute left-full ml-3 z-50",
                                "rounded-md bg-slate-800 border border-slate-700",
                                "px-2.5 py-1.5 text-xs text-white whitespace-nowrap",
                                "opacity-0 group-hover:opacity-100",
                                "transition-opacity duration-150",
                                "shadow-lg",
                            ].join(" ")}
                        >
                            {route.label}
                        </span>
                    )}

                    {/* Active indicator bar */}
                    {isActive && !collapsed && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                    )}
                </>
            )}
        </NavLink>
    );
};

export default SidebarNavItem;