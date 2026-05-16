// ui/layouts/AdminLayout/Navbar/Navbar.tsx
// Top navigation bar.
// Left : hamburger (mobile) + breadcrumb
// Right: notification bell + user menu

import React from "react";
import { Menu } from "lucide-react";
import NavBreadcrumb from "./NavBreadcrumb";
import NavNotificationBell from "./NavNotificationBell";
import NavUserMenu from "./NavUserMenu";

interface NavbarProps {
    onMobileMenuOpen: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMobileMenuOpen }) => {
    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 backdrop-blur-sm px-4 lg:px-6">

            {/* Mobile hamburger */}
            <button
                type="button"
                onClick={onMobileMenuOpen}
                className={[
                    "flex lg:hidden h-9 w-9 items-center justify-center rounded-lg",
                    "text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                ].join(" ")}
                aria-label="Open navigation menu"
            >
                <Menu size={20} strokeWidth={1.75} />
            </button>

            {/* Breadcrumb */}
            <div className="flex-1 min-w-0">
                <NavBreadcrumb />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
                <NavNotificationBell />
                <div className="mx-1 h-5 w-px bg-slate-200" />
                <NavUserMenu />
            </div>
        </header>
    );
};

export default Navbar;