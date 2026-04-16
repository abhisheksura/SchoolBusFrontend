// core/guards/RoleGuard.tsx
// Protects routes by role. Must be nested inside <AuthGuard>.
// SUPER_ADMIN bypasses every role check automatically.
//
// Route guard mode (default):
//   <Route element={<RoleGuard roles={["SCHOOL_ADMIN"]} />}>
//     <Route path="/schools" element={<SchoolsPage />} />
//   </Route>
//
// Inline mode — conditionally render UI within a page:
//   <RoleGuard roles={["BRANCH_ADMIN"]} inline>
//     <DeactivateButton />
//   </RoleGuard>

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/modules/auth/store";
import type { UserRole } from "@/modules/auth/types";

interface RoleGuardProps {
    roles: UserRole[];
    inline?: boolean;
    children?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
    roles,
    inline = false,
    children,
}) => {
    const { hasRole } = useAuthStore();
    const location = useLocation();

    const hasRequiredRole =
        hasRole("SUPER_ADMIN") || roles.some((role) => hasRole(role));

    if (inline) {
        return hasRequiredRole ? <>{children}</> : null;
    }

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