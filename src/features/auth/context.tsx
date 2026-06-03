// modules/auth/context.tsx
// Exposes auth state via React Context so components stay decoupled from
// the Zustand store implementation. Zustand remains the source of truth
// and handles persistence — Context is just the consumption layer.
//
// Why both?
//   - useAuthStore() in non-component code (interceptors, guards) — direct store
//   - useAuth()      in components                                  — this context
//
// This makes components easier to test (mock the context, not Zustand)
// and keeps the auth contract explicit.

import React, {
    createContext,
    useContext,
    useMemo,
    type ReactNode,
} from "react";
import { useAuthStore } from "./store";
import { logoutApi } from "./api";
import type { MeResponse, UserRole } from "./types";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface AuthContextValue {
    // State
    user: MeResponse | null;
    activeRole: UserRole | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Role helpers
    hasRole: (role: UserRole) => boolean;
    getSchoolIds: () => number[];
    getBranchIds: (schoolId: number) => number[];

    // Actions
    logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthContextProviderProps {
    children: ReactNode;
    isLoading: boolean; // injected by AuthProvider which owns the loading state
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({
    children,
    isLoading,
}) => {
    const {
        user,
        activeRole,
        accessToken,
        hasRole,
        getSchoolIds,
        getBranchIds,
        clearAuth,
    } = useAuthStore();

    const isAuthenticated = Boolean(accessToken && user);

    const logout = async (): Promise<void> => {
        try {
            await logoutApi();
        } catch {
            // Always clear local state even if the server call fails
        } finally {
            clearAuth();
        }
    };

    // Memoize so consumers only re-render when values actually change
    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            activeRole,
            isAuthenticated,
            isLoading,
            hasRole,
            getSchoolIds,
            getBranchIds,
            logout,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [user, activeRole, isAuthenticated, isLoading, accessToken]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAuth() — primary way for components to access auth state.
 *
 * Usage:
 *   const { user, isAuthenticated, hasRole, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth() must be used inside <AuthProvider>");
    }
    return ctx;
}