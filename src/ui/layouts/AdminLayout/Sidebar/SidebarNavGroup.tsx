// ui/layouts/AdminLayout/Sidebar/SidebarNavGroup.tsx
// Renders a labelled group of nav items (e.g. "Fleet", "Operations").
// When collapsed, hides the group label and shows only icons.

import React from "react";
import SidebarNavItem from "./SidebarNavItem";
import type { RouteConfig } from "@/core/types/routes";

interface SidebarNavGroupProps {
    label: string;
    routes: RouteConfig[];
    collapsed: boolean;
}

const SidebarNavGroup: React.FC<SidebarNavGroupProps> = ({
    label,
    routes,
    collapsed,
}) => {
    if (routes.length === 0) return null;

    return (
        <div className="flex flex-col gap-0.5">
            {/* Group label — hidden when collapsed */}
            {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600 select-none">
                    {label}
                </p>
            )}

            {/* Divider shown instead of label when collapsed */}
            {collapsed && (
                <div className="mx-auto mb-1 h-px w-6 bg-slate-700/60" />
            )}

            {routes.map((route) => (
                <SidebarNavItem
                    key={route.path}
                    route={route}
                    collapsed={collapsed}
                />
            ))}
        </div>
    );
};

export default SidebarNavGroup;