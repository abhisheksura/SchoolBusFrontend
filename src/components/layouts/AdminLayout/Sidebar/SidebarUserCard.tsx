// ui/layouts/AdminLayout/Sidebar/SidebarUserCard.tsx
// Displays the current user's name, role badge, and a logout button.
// Collapses to an avatar-only view when the sidebar is collapsed.

import React, { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { ROLE_LABELS } from "@/features/auth/types";

interface SidebarUserCardProps {
    collapsed: boolean;
}

const SidebarUserCard: React.FC<SidebarUserCardProps> = ({ collapsed }) => {
    const { user, activeRole, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (!user) return null;

    const initials = [user.user_name[0]].join("").toUpperCase();
    const displayName = user.user_name;
    const roleLabel = activeRole ? ROLE_LABELS[activeRole] : "";

    const handleLogout = async (): Promise<void> => {
        setIsLoggingOut(true);
        await logout();
        // clearAuth triggers a redirect via AuthGuard — no navigation needed
    };

    return (
        <div
            className={[
                "flex items-center gap-3 rounded-xl border border-slate-700/60",
                "bg-slate-800/50 p-3 transition-all duration-200",
                collapsed ? "justify-center px-2" : "",
            ].join(" ")}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-white shadow-md shadow-amber-500/30">
                    {initials}
                </div>
                {/* Online indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-green-400" />
            </div>

            {/* Name + role */}
            {!collapsed && (
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <p className="truncate text-sm font-semibold text-white leading-none">
                        {displayName}
                    </p>
                    <p className="truncate text-xs text-slate-400 leading-none">
                        {roleLabel}
                    </p>
                </div>
            )}

            {/* Logout button */}
            {!collapsed && (
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="Sign out"
                    className={[
                        "shrink-0 flex items-center justify-center rounded-lg",
                        "h-7 w-7 text-slate-500 transition-colors",
                        isLoggingOut
                            ? "cursor-not-allowed"
                            : "hover:bg-slate-700 hover:text-red-400",
                    ].join(" ")}
                >
                    {isLoggingOut
                        ? <Loader2 size={14} className="animate-spin" />
                        : <LogOut size={14} strokeWidth={1.75} />
                    }
                </button>
            )}

            {/* Collapsed: logout on avatar click */}
            {collapsed && (
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="Sign out"
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100"
                >
                    {/* handled via the main avatar in collapsed mode */}
                </button>
            )}
        </div>
    );
};

export default SidebarUserCard;