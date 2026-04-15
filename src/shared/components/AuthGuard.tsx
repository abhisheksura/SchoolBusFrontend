// ─── AuthGuard ───────────────────────────────────────────────────────────────
// Protects any route that requires a valid session.
//
// Behaviour:
//   • If the user has a valid access token + profile  → render children
//   • If not                                          → redirect to /auth/login
//
// Note: Because the access token lives in memory only, a hard page refresh
// will always send the user back to login — this is intentional.
// The sessionStorage-persisted `user` object is only used to pre-populate
// the profile after a silent token refresh; it is NOT used as the sole
// source of truth for "is authenticated".
//
// Usage:
//   <Route element={<AuthGuard />}>
//     <Route path="/dashboard" element={<DashboardPage />} />
//   </Route>

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AuthGuard: React.FC = () => {
    const { accessToken, user } = useAuthStore();
    const location = useLocation();

    // Both token AND user profile must be present.
    // Token alone is not enough (profile load may have failed).
    // User alone is not enough (token has expired / been cleared).
    const isAuthenticated = Boolean(accessToken && user);

    if (!isAuthenticated) {
        // Preserve the attempted URL so we can redirect back after login
        return (
            <Navigate
                to="/auth/login"
                state={{ from: location }}
                replace
            />
        );
    }

    return <Outlet />;
};

export default AuthGuard;