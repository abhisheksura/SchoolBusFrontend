// app/providers/AuthProvider.tsx
// Handles auth session rehydration on app mount.
//
// On a hard refresh, sessionStorage still has the user profile but the
// access_token is gone (memory-only). This provider detects that state
// and silently attempts a token refresh so the user doesn't hit the
// login page unnecessarily.
//
// It renders children immediately (no loading gate) — individual pages
// are protected by AuthGuard which handles the redirect if refresh fails.

import React, { useEffect, useRef } from "react";
import { useAuthStore } from "@/modules/auth/store";
import { refreshTokenApi } from "@/modules/auth/api";

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const { user, accessToken, setAuth, activeRole, clearAuth } = useAuthStore();
    const hasAttemptedRefresh = useRef(false);

    useEffect(() => {
        // Already authenticated — nothing to do
        if (accessToken && user) return;

        // No user in sessionStorage either — fresh session, skip refresh
        if (!user) return;

        // User profile exists in sessionStorage but token is gone (page refresh).
        // Attempt a silent token refresh using the httpOnly refresh-token cookie.
        if (!hasAttemptedRefresh.current) {
            hasAttemptedRefresh.current = true;

            refreshTokenApi()
                .then(({ access_token }) => {
                    // Restore the full auth state with the refreshed token
                    setAuth(access_token, user, activeRole ?? user.roles[0]?.role_name);
                })
                .catch(() => {
                    // Refresh token expired or invalid — force re-login
                    clearAuth();
                });
        }
    }, [accessToken, user, activeRole, setAuth, clearAuth]);

    return <>{children}</>;
};

export default AuthProvider;