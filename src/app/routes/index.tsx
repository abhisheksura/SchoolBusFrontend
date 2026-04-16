// app/routes/index.tsx
// All route definitions using React Router v6 nested layout pattern.
//
// Guard layering:
//   <AuthGuard>  — user must be logged in
//     <RoleGuard> — user must hold the required role(s)

import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AuthGuard from "@/core/guards/AuthGuard";
import RoleGuard from "@/core/guards/RoleGuard";
import UnauthorizedPage from "@/ui/components/UnauthorizedPage";

// Eagerly loaded — needed on first paint
import LoginPage from "@/modules/auth/pages/LoginPage";

// Lazy loaded — split by module
{/*
const DashboardPage     = lazy(() => import("@/modules/dashboard/pages/DashboardPage"));
const SchoolsPage       = lazy(() => import("@/modules/schools/pages/SchoolsPage"));
const BranchesPage      = lazy(() => import("@/modules/schools/pages/BranchesPage"));
const BusesPage         = lazy(() => import("@/modules/buses/pages/BusesPage"));
const DriversPage       = lazy(() => import("@/modules/users/pages/DriversPage"));
const GpsDevicesPage    = lazy(() => import("@/modules/tracking/pages/GpsDevicesPage"));
const RoutesPage        = lazy(() => import("@/modules/routes/pages/RoutesPage"));
const TripsPage         = lazy(() => import("@/modules/tracking/pages/TripsPage"));
const StudentsPage      = lazy(() => import("@/modules/users/pages/StudentsPage"));
const AssignmentsPage   = lazy(() => import("@/modules/users/pages/AssignmentsPage"));
const AttendancePage    = lazy(() => import("@/modules/attendance/pages/AttendancePage"));
const NotificationsPage = lazy(() => import("@/modules/notifications/pages/NotificationsPage"));
*/}
const PageLoader: React.FC = () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
    </div>
);

const AppRoutes: React.FC = () => (
    <Suspense fallback={<PageLoader />}>
        <Routes>

            {/* Public */}
            <Route path="/auth/login"   element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected: must be authenticated */}
            <Route element={<AuthGuard />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* All authenticated roles */}
                {/*
                <Route path="/dashboard" element={<DashboardPage />} />
                */}
                {/* SCHOOL_ADMIN + SUPER_ADMIN */}
                {/*
                <Route element={<RoleGuard roles={["SCHOOL_ADMIN"]} />}>
                    <Route path="/schools"                          element={<SchoolsPage />} />
                    <Route path="/schools/:schoolId/branches"       element={<BranchesPage />} />
                </Route>
                */}

                {/* SCHOOL_ADMIN + BRANCH_ADMIN + SUPER_ADMIN */}
                {/*
                <Route element={<RoleGuard roles={["SCHOOL_ADMIN", "BRANCH_ADMIN"]} />}>
                    <Route path="/fleet/buses"  element={<BusesPage />} />
                    <Route path="/drivers"      element={<DriversPage />} />
                    <Route path="/gps/devices"  element={<GpsDevicesPage />} />
                </Route>
                */}
                {/* BRANCH_ADMIN + SUPER_ADMIN */}
                {/*
                <Route element={<RoleGuard roles={["BRANCH_ADMIN"]} />}>
                    <Route path="/routes"        element={<RoutesPage />} />
                    <Route path="/trips"         element={<TripsPage />} />
                    <Route path="/students"      element={<StudentsPage />} />
                    <Route path="/assignments"   element={<AssignmentsPage />} />
                    <Route path="/attendance"    element={<AttendancePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
                */}
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
    </Suspense>
);

export default AppRoutes;