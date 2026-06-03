// app/routes/AppRoutes.tsx
// Config-driven route tree. All route definitions live in module routes.ts
// files and are aggregated in routeConfig.ts — this file only wires them
// into React Router.
//
// RoleGuard wraps each route element individually (not as a nested Route)
// so the route config's `roles` array drives access control directly.

import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AuthGuard     from "@/core/guards/AuthGuard";
import RoleGuard     from "@/core/guards/RoleGuard";
import LoginPage     from "@/features/auth/pages/LoginPage";
import AdminLayout   from "@/components/layouts/AdminLayout";
import PageLoader    from "./PageLoader";
import { allRoutes } from "./routeConfig";
import { UnauthorizedPage } from "@/components/";


const AppRoutes: React.FC = () => (
    <Suspense fallback={<PageLoader />}>
        <Routes>

            {/* ── Public ──────────────────────────────────────────────────── */}
            <Route path="/auth/login"   element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ── Protected ───────────────────────────────────────────────── */}
            <Route element={<AuthGuard />}>
                <Route element={<AdminLayout />}>

                    <Route index element={<Navigate to="/dashboard" replace />} />

                    {allRoutes.map((route) => {
                        const Page = route.element;
                        return (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={
                                    route.roles.length > 0 ? (
                                        <RoleGuard roles={route.roles} inline>
                                            <Page />
                                        </RoleGuard>
                                    ) : (
                                        <Page />
                                    )
                                }
                            />
                        );
                    })}

                </Route>
            </Route>

            {/* ── 404 ─────────────────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
    </Suspense>
);

export default AppRoutes;