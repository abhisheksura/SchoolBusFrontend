// ─── Auth Store ──────────────────────────────────────────────────────────────
// Zustand store for authentication state.
//
// Storage strategy:
//   • access_token  → in-memory only (Zustand state, cleared on tab close)
//   • refresh_token → sessionStorage  (survives refresh but not new tab)
//   • user profile  → sessionStorage  (so the page reload doesn't flash login)
//
// The store is hydrated from sessionStorage on first import, giving a
// seamless refresh experience while avoiding the XSS risk of localStorage.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthState, MeResponse, UserRole } from "./types";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // ── State ─────────────────────────────────────────────────────────
            user: null,
            accessToken: null,
            activeRole: null,

            // ── Actions ───────────────────────────────────────────────────────

            setAuth: (
                token: string,
                user: MeResponse,
                role: UserRole
            ): void => {
                set({ accessToken: token, user, activeRole: role });
            },

            clearAuth: (): void => {
                set({ accessToken: null, user: null, activeRole: null });
                // Also wipe the persisted sessionStorage key immediately
                sessionStorage.removeItem("bus-tracker-auth");
            },

            hasRole: (role: UserRole): boolean => {
                const { user } = get();
                if (!user) return false;
                return user.roles.some(
                    (r) => r.role_name === role && r.is_active
                );
            },

            getSchoolIds: (): number[] => {
                const { user } = get();
                if (!user) return [];
                // SUPER_ADMIN is not scoped — return empty so API returns all
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
                // SUPER_ADMIN and SCHOOL_ADMIN are unrestricted at branch level
                if (
                    get().hasRole("SUPER_ADMIN") ||
                    get().hasRole("SCHOOL_ADMIN")
                )
                    return [];
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
            // Only persist user + role to sessionStorage.
            // access_token is intentionally excluded (stays memory-only).
            partialize: (state) => ({
                user: state.user,
                activeRole: state.activeRole,
                // access_token is NOT included here
            }),
        }
    )
);