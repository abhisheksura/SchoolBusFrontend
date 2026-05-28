// src/tenant/hooks/useTenantOptions.ts
//
// Shared hook used by every module form that needs school/branch selectors
// or read-only tenant context (e.g. StopForm, DriverForm, RouteForm, TripForm).
//
// Eliminates the per-module copy-paste of:
//   - useQuery for schools list
//   - useQuery for branches list (reactive on selected school)
//   - resolving display names for the read-only edit view
//   - showTenantSelectors logic
//
// Usage:
//   const tenant = useTenantOptions({ entitySchoolId: stop?.school_id, entityBranchId: stop?.branch_id });
//   <TenantSelectors {...tenant.selectorProps} />
//   {tenant.readOnly && <TenantReadOnly school={tenant.schoolLabel} branch={tenant.branchLabel} />}
import { useState }  from "react";

import { useTenantScope } from "./useTenantScope";
import { useQuery }  from "@tanstack/react-query";

import { getSchools, getBranches } from "@/modules/schools/api";
import type { SchoolResponse } from "@/core/types/tenant";

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
 
interface UseTenantOptionsInput {
    // When editing an existing entity, pass its stored tenant IDs.
    // The hook uses these to resolve display names for the read-only view.
    // entitySchoolId?: number;
    // entityBranchId?: number;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
 
export interface SelectOption {
    label: string;
    value: number;
}
 
export interface UseTenantOptionsResult {
    // ── Whether to show selectors vs read-only panel ────────────────────
    // true  → entity exists, show read-only tenant context
    // false → creating new entity, show selectors (if applicable)
    // isEditing: boolean;
 
    // ── Read-only display values (edit mode) ────────────────────────────
    // Resolved in priority: tenantScope names → fetched options → ID fallback
    // schoolLabel: string;
    // branchLabel: string;
 
    // ── Selector props (create mode) ────────────────────────────────────
    //tenantScope:    ReturnType<typeof useTenantScope>;
    schoolOptions:  SelectOption[];
    branchOptions:  SelectOption[];
    //isFetching:     boolean;
 
    // ── Reactive school change ───────────────────────────────────────────
    // Call this when user picks a school in the selector.
    // Triggers branch options re-fetch and clears stale branch selection.
    onSchoolChange: (schoolId: number | undefined) => void;
}

export function useTenantOptions({
    //entitySchoolId,
    //  entityBranchId,
}: UseTenantOptionsInput = {}): UseTenantOptionsResult {
    
    const tenantScope = useTenantScope();

    // ── Reactive school selection for branch fetching ────────────────────
    // For SUPER_ADMIN: starts undefined, user picks school → branches load.
    // For school_locked: pre-filled with their school from scope.
    // For fully_locked: pre-filled too, but branch query is skipped.
 
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(
        tenantScope.accessLevel === "school_locked" || tenantScope.accessLevel === "fully_locked"
            ? tenantScope.schoolId
            : undefined
    );

    const handleSchoolChange = (schoolId: number | undefined) => {
        setSelectedSchoolId(schoolId);
    };
    // ── Schools query — SUPER_ADMIN only ────────────────────────────────
    // school_locked and fully_locked roles have their school in the JWT —
    // no need to fetch a list.
    const { data: schoolsData, isFetching: schoolsFetching } = useQuery({
        queryKey: ["schools", { active_only: true, page_size: 100 }],
        queryFn:  () => getSchools({ active_only: true, page: 1, page_size: 100 }),
        enabled:  tenantScope.accessLevel === "open",
        staleTime: 60_000,
    });

    // ── Branches query — SUPER_ADMIN and SCHOOL_ADMIN ───────────────────
    // SUPER_ADMIN: resolvedSchoolId comes from form selection (selectedSchoolId)
    // SCHOOL_ADMIN: resolvedSchoolId comes from their scope (tenantScope.schoolId)
    // BRANCH_ADMIN: fully_locked — branch is known, no query needed
 
    const resolvedSchoolId =
        tenantScope.accessLevel === "open"
            ? selectedSchoolId
            : tenantScope.schoolId;

    const { data: branchesData, isFetching: branchesFetching } = useQuery({
        queryKey: ["branches", resolvedSchoolId, { active_only: true, page_size: 100 }],
        queryFn:  () =>
            getBranches(resolvedSchoolId!, {
                active_only: true,
                page:        1,
                page_size:   100,
            }),
        enabled:
            !!resolvedSchoolId &&
            tenantScope.accessLevel !== "fully_locked",
        staleTime: 60_000,
    });
 
    const schoolOptions: SelectOption[] = (schoolsData?.items ?? []).map((s:SchoolResponse) => ({
        label: s.school_name,
        value: s.school_id,
    }));

    const branchOptions: SelectOption[] = (branchesData?.items ?? []).map((b) => ({
        label: b.branch_name,
        value: b.branch_id,
    }));

    return {
        schoolOptions,
        branchOptions,
        onSchoolChange: handleSchoolChange,
    }
}
