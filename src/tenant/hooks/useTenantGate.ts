import { useCallback, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenantScope } from "./useTenantScope";
import { getSchools, getBranches } from "@/modules/schools/api";
import type { SchoolResponse, BranchResponse } from "@/modules/schools/types";

export interface SelectOption {
    label: string;
    value: number;
}

export interface TenantGateState {
    isSuperAdmin: boolean;
    isSchoolAdmin: boolean;
    isBranchAdmin: boolean;
    showGate: boolean;
    
    selectorSchoolId: number | undefined;
    selectorBranchId: number | undefined;
    
    resolvedSchoolId: number | undefined;
    resolvedBranchId: number | undefined;
    scopeReady: boolean;
    
    schoolOptions: SelectOption[];
    branchOptions: SelectOption[];
    schoolsLoading: boolean;
    branchesLoading: boolean;
    
    lockedSchoolName: string | undefined;
    lockedBranchName: string | undefined;
    
    onSchoolChange: (schoolId: number | undefined) => void;
    onBranchChange: (branchId: number | undefined) => void;
}

export function useTenantGate(): TenantGateState {
    const scope = useTenantScope();

    const isSuperAdmin  = scope.accessLevel === "open";
    const isSchoolAdmin = scope.accessLevel === "school_locked";
    const isBranchAdmin = scope.accessLevel === "fully_locked";

    const [selectorSchoolId, setSelectorSchoolId] = useState<number | undefined>(undefined);
    const [selectorBranchId, setSelectorBranchId] = useState<number | undefined>(undefined);

    const onSchoolChange = useCallback((schoolId: number | undefined) => {
        setSelectorSchoolId(schoolId);
        setSelectorBranchId(undefined);
    }, []);

    const onBranchChange = useCallback((branchId: number | undefined) => {
        setSelectorBranchId(branchId);
    }, []);

    const resolvedSchoolId = isSuperAdmin ? selectorSchoolId : scope.schoolId;
    const resolvedBranchId = isBranchAdmin ? scope.branchId : selectorBranchId;

    const scopeReady = resolvedSchoolId !== undefined && resolvedBranchId !== undefined;

    // Global caching structures for performance
    const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
        queryKey: ["schools", "gate-options", { active_only: true }],
        queryFn: () => getSchools({ active_only: true, page: 1, page_size: 100 }),
        enabled: isSuperAdmin,
        staleTime: 5 * 60_000,
    });

    const branchQuerySchoolId = isSuperAdmin ? selectorSchoolId : scope.schoolId;

    const { data: branchesData, isLoading: branchesLoading } = useQuery({
        queryKey: ["branches", "gate-options", branchQuerySchoolId, { active_only: true }],
        queryFn: () => getBranches(branchQuerySchoolId!, { active_only: true, page: 1, page_size: 100 }),
        enabled: !!branchQuerySchoolId && !isBranchAdmin,
        staleTime: 5 * 60_000,
    });

    // Production-Grade optimization: Memoize transforms to prevent unnecessary rerenders
    const schoolOptions = useMemo((): SelectOption[] => 
        (schoolsData?.items ?? []).map((s: SchoolResponse) => ({
            label: s.school_name,
            value: s.school_id,
        })), [schoolsData]);

    const branchOptions = useMemo((): SelectOption[] => 
        (branchesData?.items ?? []).map((b: BranchResponse) => ({
            label: b.branch_name,
            value: b.branch_id,
        })), [branchesData]);

    return {
        isSuperAdmin,
        isSchoolAdmin,
        isBranchAdmin,
        showGate: isSuperAdmin || isSchoolAdmin,
        selectorSchoolId,
        selectorBranchId,
        resolvedSchoolId,
        resolvedBranchId,
        scopeReady,
        schoolOptions,
        branchOptions,
        schoolsLoading,
        branchesLoading,
        lockedSchoolName: scope.schoolName,
        lockedBranchName: scope.branchName,
        onSchoolChange,
        onBranchChange,
    };
}