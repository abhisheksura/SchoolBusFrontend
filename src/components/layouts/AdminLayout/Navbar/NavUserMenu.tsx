// ui/layouts/AdminLayout/Navbar/NavUserMenu.tsx
// Avatar button in the top-right of the navbar.
// Shows user initials, name, role badge, and a logout option.

import React, { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@/modules/auth/context";
import { ROLE_LABELS } from "@/modules/auth/types";

const NavUserMenu: React.FC = () => {
    const { user, activeRole, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    if (!user) return null;

    const initials = user.user_name.slice(0, 2).toUpperCase();
    const roleLabel = activeRole ? ROLE_LABELS[activeRole] : "";

    const handleLogout = async (): Promise<void> => {
        setIsLoggingOut(true);
        setOpen(false);
        await logout();
    };

    return (
        <div ref={menuRef} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className={[
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5",
                    "border border-transparent transition-all duration-150",
                    "hover:border-slate-200 hover:bg-slate-50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                    open ? "border-slate-200 bg-slate-50" : "",
                ].join(" ")}
                aria-haspopup="true"
                aria-expanded={open}
            >
                {/* Avatar */}
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-white shadow-sm shadow-amber-500/30">
                    {initials}
                </div>

                {/* Name + role — hidden on small screens */}
                <div className="hidden sm:flex flex-col items-start gap-0 leading-none">
                    <span className="text-sm font-semibold text-slate-700 leading-tight">
                        {user.user_name}
                    </span>
                    <span className="text-xs text-slate-400 leading-tight">
                        {roleLabel}
                    </span>
                </div>

                <ChevronDown
                    size={14}
                    strokeWidth={2}
                    className={[
                        "hidden sm:block text-slate-400 transition-transform duration-200",
                        open ? "rotate-180" : "",
                    ].join(" ")}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className={[
                        "absolute right-0 top-full mt-2 z-50",
                        "w-56 rounded-xl border border-slate-200 bg-white",
                        "shadow-xl shadow-slate-200/60 overflow-hidden",
                    ].join(" ")}
                    role="menu"
                >
                    {/* User info header */}
                    <div className="border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-white">
                                {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="truncate text-sm font-semibold text-slate-800">
                                    {user.user_name}
                                </span>
                                <span className="inline-flex self-start mt-0.5 items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                    {roleLabel}
                                </span>
                            </div>
                        </div>

                        {user.email && (
                            <p className="mt-2 truncate text-xs text-slate-400">
                                {user.email}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-1.5">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={[
                                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2",
                                "text-sm text-red-600 transition-colors",
                                isLoggingOut
                                    ? "cursor-not-allowed opacity-60"
                                    : "hover:bg-red-50",
                            ].join(" ")}
                        >
                            {isLoggingOut
                                ? <Loader2 size={15} className="animate-spin" />
                                : <LogOut size={15} strokeWidth={1.75} />
                            }
                            {isLoggingOut ? "Signing out..." : "Sign out"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavUserMenu;