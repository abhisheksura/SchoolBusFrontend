// src/core/hooks/useTenantFilter.ts

import { useAuth } from './useAuth';

/**
 * Hook to get tenant-specific filters based on user role
 * - SUPER_ADMIN: No filters (sees everything)
 * - SCHOOL_ADMIN: Filters by their school_id
 * - BRANCH_ADMIN: Filters by their school_id and branch_id
 */
export const useTenantFilter = () => {
    const { user } = useAuth();

    const getTenantFilter = () => {
        if (!user) {
            return {};
        }

        // SUPER_ADMIN sees everything
        if (user.role === 'SUPER_ADMIN') {
            return {};
        }

        // SCHOOL_ADMIN sees all branches in their school
        if (user.role === 'SCHOOL_ADMIN') {
            return {
                school_id: user.school_id,
            };
        }

        // BRANCH_ADMIN sees only their branch
        if (user.role === 'BRANCH_ADMIN') {
            return {
                school_id: user.school_id,
                branch_id: user.branch_id,
            };
        }

        // Default: filter by school and branch
        return {
            school_id: user.school_id,
            branch_id: user.branch_id,
        };
    };

    const canAccessSchool = (schoolId: number): boolean => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return user.school_id === schoolId;
    };

    const canAccessBranch = (schoolId: number, branchId: number): boolean => {
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        if (user.role === 'SCHOOL_ADMIN') return user.school_id === schoolId;
        return user.school_id === schoolId && user.branch_id === branchId;
    };

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
    const isBranchAdmin = user?.role === 'BRANCH_ADMIN';

    return {
        getTenantFilter,
        canAccessSchool,
        canAccessBranch,
        isSuperAdmin,
        isSchoolAdmin,
        isBranchAdmin,
        userSchoolId: user?.school_id,
        userBranchId: user?.branch_id,
    };
};