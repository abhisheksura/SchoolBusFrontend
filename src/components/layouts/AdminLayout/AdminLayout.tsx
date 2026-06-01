// ui/layouts/AdminLayout/AdminLayout.tsx
// Root layout for all authenticated admin pages.
// Renders the collapsible Sidebar, sticky Navbar, and the page <Outlet>.
//
// Layout topology:
//
//   ┌──────────────────────────────────────────┐
//   │  Sidebar (240px / 60px collapsed)         │  Navbar (h-16, sticky)  │
//   │  [sticky, full-height]                    ├─────────────────────────┤
//   │                                           │  <Outlet />             │
//   │                                           │  (page content)         │
//   └──────────────────────────────────────────┘

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const AdminLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobileOpen, setMobileOpen] = useState<boolean>(false);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <Sidebar
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((p) => !p)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            {/* ── Main content area ─────────────────────────────────────── */}
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

                {/* Sticky top navbar */}
                <Navbar onMobileMenuOpen={() => setMobileOpen(true)} />

                {/* Scrollable page content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default AdminLayout;