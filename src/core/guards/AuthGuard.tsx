// core/guards/AuthGuard.tsx
// Redirects unauthenticated users to /auth/login.
// Wrap protected route groups with this inside the router.
//
// Usage:
//   <Route element={<AuthGuard />}>
//     <Route path="/dashboard" element={<DashboardPage />} />
//   </Route>

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth";

const AuthGuard: React.FC = () => {
    const { accessToken, user } = useAuthStore();
    const location = useLocation();

    const isAuthenticated = Boolean(accessToken && user);

    if (!isAuthenticated) {
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