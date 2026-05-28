// src/tenant/hooks/useTenantScope.ts

import { useAuthStore } from "@/modules/auth/store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantAccessLevel =
    | "open"
    | "school_locked"
    | "fully_locked"
    | "no_access";

export interface TenantScope {
    accessLevel: TenantAccessLevel;

    schoolId?: number;
    schoolName?: string;

    branchId?: number;
    branchName?: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTenantScope(): TenantScope {
    const { user } = useAuthStore();

    if (!user) {
        return {
            accessLevel: "no_access",
        };
    }

    const isStudent = user.roles.some(r => r.role_name === "STUDENT");
    const isDriver  = user.roles.some(r => r.role_name === "DRIVER");

    if (isStudent || isDriver) {
        return {
            accessLevel: "no_access",
            schoolId: undefined,
            branchId: undefined,
        };
    }

    // SUPER_ADMIN
    const isSuperAdmin =
        user.roles.some(
            (r) => r.role_name === "SUPER_ADMIN"
        );

    if (isSuperAdmin) {
        return {
            accessLevel: "open",
        };
    }

    // BRANCH_ADMIN
    const branchRole = user.roles.find(
        (r) =>
            r.role_name === "BRANCH_ADMIN" &&
            r.is_active
    );

    if (branchRole) {
        return {
            accessLevel: "fully_locked",

            schoolId: branchRole.school_id ?? undefined,
            schoolName:
                branchRole.school_name ?? undefined,

            branchId: branchRole.branch_id ?? undefined,
            branchName:
                branchRole.branch_name ?? undefined,
        };
    }

    // SCHOOL_ADMIN
    const schoolRole = user.roles.find(
        (r) =>
            r.role_name === "SCHOOL_ADMIN" &&
            r.is_active
    );
    console.log("SchoolAdmin1");
    console.log(schoolRole);
    console.log("SchoolAdmin2");
    if (schoolRole) {
        return {
            accessLevel: "school_locked",

            schoolId: schoolRole.school_id ?? undefined,
            schoolName:
                schoolRole.school_name ?? undefined,
        };
    }

    return {
        accessLevel: "no_access",
    };
}