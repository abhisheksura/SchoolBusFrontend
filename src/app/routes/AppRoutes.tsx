// app/routes/AppRoutes.tsx
// Route tree using React Router v6 nested layout pattern.
// Lazy imports live in lazyRoutes.ts — this file only handles structure.
//
// Guard layering:
//   <AuthGuard>   — must be authenticated
//     <RoleGuard> — must hold one of the listed roles
//                   (SUPER_ADMIN bypasses all role checks automatically)

import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// import AuthGuard from "@/core/guards/AuthGuard";
// import RoleGuard from "@/core/guards/RoleGuard";
import UnauthorizedPage from "@/ui/components/UnauthorizedPage";
import LoginPage from "@/modules/auth/pages/LoginPage";
import PageLoader from "./PageLoader";

/*
import {
    DashboardPage,
    SchoolsPage,
    BranchesPage,
    BusesPage,
    DriversPage,
    StudentsPage,
    AssignmentsPage,
    GpsDevicesPage,
    TripsPage,
    RoutesPage,
    AttendancePage,
    NotificationsPage,
} from "./lazyRoutes";
*/
const AppRoutes: React.FC = () => (
    <Suspense fallback={<PageLoader />}>
        <Routes>

            {/* ── Public ──────────────────────────────────────────────────── */}
            <Route path="/auth/login"   element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* ── Protected: authenticated users only ─────────────────────── */}
            {/*
            <Route element={<AuthGuard />}>
/*}
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* All authenticated roles */}
                {/*
                <Route path="/dashboard" element={<DashboardPage />} />
                /*}
                {/* SUPER_ADMIN + SCHOOL_ADMIN */}
                {/*
                <Route element={<RoleGuard roles={["SCHOOL_ADMIN"]} />}>
                    <Route path="/schools"                    element={<SchoolsPage />} />
                    <Route path="/schools/:schoolId/branches" element={<BranchesPage />} />
                </Route>
                /*}
                {/* SUPER_ADMIN + SCHOOL_ADMIN + BRANCH_ADMIN */}
                {/*
                <Route element={<RoleGuard roles={["SCHOOL_ADMIN", "BRANCH_ADMIN"]} />}>
                    <Route path="/fleet/buses" element={<BusesPage />} />
                    <Route path="/drivers"     element={<DriversPage />} />
                    <Route path="/gps/devices" element={<GpsDevicesPage />} />
                </Route>
                /*}
                {/* SUPER_ADMIN + BRANCH_ADMIN */}
                {/*
                <Route element={<RoleGuard roles={["BRANCH_ADMIN"]} />}>
                    <Route path="/routes"        element={<RoutesPage />} />
                    <Route path="/trips"         element={<TripsPage />} />
                    <Route path="/students"      element={<StudentsPage />} />
                    <Route path="/assignments"   element={<AssignmentsPage />} />
                    <Route path="/attendance"    element={<AttendancePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
                /*}
            </Route>

            {/* ── 404 fallback ─────────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
    </Suspense>
);

export default AppRoutes;