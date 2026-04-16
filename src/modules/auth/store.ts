// modules/auth/store.ts
// Zustand auth store with sessionStorage persistence.
// access_token is intentionally excluded from persistence (memory-only).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthState, MeResponse, UserRole } from "./types";

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            activeRole: null,

            setAuth: (token: string, user: MeResponse, role: UserRole): void => {
                set({ accessToken: token, user, activeRole: role });
            },

            clearAuth: (): void => {
                set({ accessToken: null, user: null, activeRole: null });
                sessionStorage.removeItem("bus-tracker-auth");
            },

            hasRole: (role: UserRole): boolean => {
                const { user } = get();
                if (!user) return false;
                return user.roles.some((r) => r.role_name === role && r.is_active);
            },

            getSchoolIds: (): number[] => {
                const { user } = get();
                if (!user) return [];
                if (get().hasRole("SUPER_ADMIN")) return [];
                return [
                    ...new Set(
                        user.roles
                            .filter((r) => r.school_id !== null && r.is_active)
                            .map((r) => r.school_id as number)
                    ),
                ];
            },

            getBranchIds: (schoolId: number): number[] => {
                const { user } = get();
                if (!user) return [];
                if (get().hasRole("SUPER_ADMIN") || get().hasRole("SCHOOL_ADMIN")) return [];
                return user.roles
                    .filter(
                        (r) =>
                            r.school_id === schoolId &&
                            r.branch_id !== null &&
                            r.is_active
                    )
                    .map((r) => r.branch_id as number);
            },
        }),
        {
            name: "bus-tracker-auth",
            storage: createJSONStorage(() => sessionStorage),
            // Only persist user + role. access_token stays in memory only.
            partialize: (state) => ({
                user: state.user,
                activeRole: state.activeRole,
            }),
        }
    )
);