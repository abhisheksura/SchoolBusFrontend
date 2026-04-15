// ─── App Routes ──────────────────────────────────────────────────────────────
// All route definitions using React Router v6 nested layout pattern.
//
// Guard layering:
//   1. <AuthGuard>   — outer: user must be logged in
//   2. <RoleGuard>   — inner: user must hold the required role(s)
//
// SUPER_ADMIN passes every RoleGuard automatically (see RoleGuard.tsx).
//
// Lazy imports are used for every page except Login so the initial bundle
// stays small.

import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
 
import AuthGuard from "@/shared/components/AuthGuard";
import RoleGuard from "@/shared/components/RoleGuard";
import UnauthorizedPage from "@/shared/components/UnauthorizedPage";

// ── Eagerly loaded (small, part of auth chunk) ────────────────────────────
import { LoginPage } from "@/features/auth";

// ── Lazily loaded pages (split by feature) ────────────────────────────────
{/*}
const DashboardPage   = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const SchoolsPage     = lazy(() => import("@/features/schools/pages/SchoolsPage"));
const BranchesPage    = lazy(() => import("@/features/schools/pages/BranchesPage"));
const BusesPage       = lazy(() => import("@/features/buses/pages/BusesPage"));
const DriversPage     = lazy(() => import("@/features/drivers/pages/DriversPage"));
const GpsDevicesPage  = lazy(() => import("@/features/gps/pages/GpsDevicesPage"));
const RoutesPage      = lazy(() => import("@/features/routes/pages/RoutesPage"));
const TripsPage       = lazy(() => import("@/features/trips/pages/TripsPage"));
const StudentsPage    = lazy(() => import("@/features/students/pages/StudentsPage"));
const AssignmentsPage = lazy(() => import("@/features/assignments/pages/AssignmentsPage"));
const AttendancePage  = lazy(() => import("@/features/attendance/pages/AttendancePage"));
const NotificationsPage = lazy(() => import("@/features/notifications/pages/NotificationsPage"));
*/}
// ── Fallback while lazy chunks load ──────────────────────────────────────
const PageLoader: React.FC = () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
    </div>
);

// ---------------------------------------------------------------------------
// Route tree
// ---------------------------------------------------------------------------

export const AppRoutes: React.FC = () => (
    <Suspense fallback={<PageLoader />}>
        <Routes>

            {/* ── Public ─────────────────────────────────────────────────── */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            {/* ── Protected: must be authenticated ───────────────────────── */}
            <Route element={<AuthGuard />}>

               

            </Route>

            {/* ── 404 fallback ───────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
    </Suspense>
);