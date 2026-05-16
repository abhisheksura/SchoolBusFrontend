// app/providers/AuthProvider.tsx
// Responsibilities:
//   1. On mount: detect "user in sessionStorage but no token" (page refresh)
//      and attempt a silent token refresh via the httpOnly cookie.
//   2. Track a loading state so the app can show a spinner instead of
//      flashing the login page during the refresh attempt.
//   3. Wire up AuthContextProvider so components can use useAuth().
//
// Zustand stays the source of truth. This provider only adds:
//   - The refresh-on-mount side effect
//   - The isLoading flag
//   - The React Context layer via AuthContextProvider

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuthStore } from "@/modules/auth/store";
import { refreshTokenApi } from "@/modules/auth/api";
import { AuthContextProvider } from "@/modules/auth/context";

interface AuthProviderProps {
    children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const { user, accessToken, activeRole, setAuth, clearAuth } = useAuthStore();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Guard against running the refresh effect more than once.
    // React 18 Strict Mode mounts effects twice in dev — the ref prevents
    // a double refresh attempt.
    const hasAttemptedRefresh = useRef(false);

    useEffect(() => {
        // Already fully authenticated — nothing to do
        if (accessToken && user) return;

        // No user profile in sessionStorage — fresh session, skip refresh
        if (!user) return;

        // User profile exists (from sessionStorage) but token is gone because
        // the page was hard-refreshed. Attempt a silent refresh.
        if (hasAttemptedRefresh.current) return;
        hasAttemptedRefresh.current = true;

        setIsLoading(true);

        refreshTokenApi()
            .then(({ access_token }) => {
                setAuth(
                    access_token,
                    user,
                    activeRole ?? user.roles[0]?.role_name
                );
            })
            .catch(() => {
                // Refresh token expired or cookie missing — force re-login
                clearAuth();
            })
            .finally(() => {
                setIsLoading(false);
            });

    // Intentionally empty deps — this effect runs once on mount only.
    // The ref guard prevents re-runs if the component re-mounts (Strict Mode).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Show a full-page spinner while the silent refresh is in flight.
    // Without this, AuthGuard would redirect to /login for a brief moment
    // before the refresh completes and restores the session.
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    <p className="text-xs text-slate-400 tracking-wide">Restoring session...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContextProvider isLoading={isLoading}>
            {children}
        </AuthContextProvider>
    );
};

export default AuthProvider;