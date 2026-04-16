// core/hooks/useAuth.ts
// Thin convenience hook over useAuthStore.
// Use this in components — reserve direct useAuthStore usage for
// non-component code (interceptors, route guards).

import { useAuthStore } from "@/modules/auth/store";
import { logoutApi } from "@/modules/auth/api";

export function useAuth() {
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
            // Always clear local state even if the API call fails
        } finally {
            clearAuth();
        }
    };

    return {
        user,
        activeRole,
        isAuthenticated,
        hasRole,
        getSchoolIds,
        getBranchIds,
        logout,
    };
}