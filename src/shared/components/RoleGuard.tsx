// ─── RoleGuard ───────────────────────────────────────────────────────────────
// Protects routes that are restricted to specific roles.
// Must always be nested INSIDE an <AuthGuard> — it assumes the user is
// already authenticated.
//
// Behaviour:
//   • User holds at least one of the required roles  → render children
//   • User does not hold any required role           → redirect to /unauthorized
//   • SUPER_ADMIN always passes every role check     → render children
//
// Props:
//   roles   — one or more roles that are allowed to access this route.
//             Any match is sufficient (OR logic, not AND).
//
// Usage (single role):
//   <Route element={<RoleGuard roles={["SCHOOL_ADMIN"]} />}>
//     <Route path="/schools" element={<SchoolsPage />} />
//   </Route>
//
// Usage (multiple allowed roles):
//   <Route element={<RoleGuard roles={["SCHOOL_ADMIN", "SUPER_ADMIN"]} />}>
//     <Route path="/schools" element={<SchoolsPage />} />
//   </Route>
//
// Usage (render-prop style for inline guards):
//   <RoleGuard roles={["BRANCH_ADMIN"]} inline>
//     <DeactivateButton />
//   </RoleGuard>

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store";
import type { UserRole } from "@/features/auth/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RoleGuardProps {
    /** One or more roles permitted to access this route */
    roles: UserRole[];

    /**
     * When true, renders `children` instead of <Outlet />.
     * Use this for inline conditional rendering within a page
     * (e.g. showing/hiding a button based on role).
     * When inline + unauthorized, renders null (no redirect).
     */
    inline?: boolean;

    /** Only used when inline={true} */
    children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RoleGuard: React.FC<RoleGuardProps> = ({
    roles,
    inline = false,
    children,
}) => {
    const { hasRole } = useAuthStore();
    const location = useLocation();

    // SUPER_ADMIN bypasses every role check
    const isSuperAdmin = hasRole("SUPER_ADMIN");

    // Check if the user holds at least one of the required roles
    const hasRequiredRole =
        isSuperAdmin || roles.some((role) => hasRole(role));

    // ── Inline mode — no redirect, just hide/show ─────────────────────────
    if (inline) {
        if (!hasRequiredRole) return null;
        return <>{children}</>;
    }

    // ── Route guard mode ──────────────────────────────────────────────────
    if (!hasRequiredRole) {
        return (
            <Navigate
                to="/unauthorized"
                state={{ from: location, requiredRoles: roles }}
                replace
            />
        );
    }

    return <Outlet />;
};

export default RoleGuard;