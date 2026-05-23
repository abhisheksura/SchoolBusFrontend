// src/modules/schools/api/index.ts

import api from '../../../core/api/client';
import type { PaginatedResponse, PaginationParams } from '../../../core/types/pagination';
import type {
    SchoolResponse, 
    BranchResponse,
    SchoolCreateRequest, 
    SchoolUpdateRequest,
    SchoolFilters,
    SchoolWithBranches,
    BranchCreateRequest,
    BranchUpdateRequest 
} from '../types';

// ==================== Schools API ====================

/**
 * Get paginated list of schools
 * SUPER_ADMIN: sees all schools
 * SCHOOL_ADMIN: sees only their school
 */
export const getSchools = async (params?: PaginationParams): Promise<PaginatedResponse<SchoolResponse>> => {
    const response = await api.get<PaginatedResponse<SchoolResponse>>('/schools/', { params });
    return response.data;
};

/**
 * Get single school by ID
 */
export const getSchool = async (schoolId: number): Promise<SchoolResponse> => {
    const response = await api.get<SchoolResponse>(`/schools/${schoolId}/`);
    return response.data;
};

/**
 * Get school with branch details and counts
 */
export const getSchoolWithDetails = async (
    schoolId: number
): Promise<SchoolWithBranches> => {
    const response = await api.get<SchoolWithBranches>(`/schools/${schoolId}/details`);
    return response.data;
};
/**
 * Create new school (SUPER_ADMIN only)
 */
export const createSchool = async (data: SchoolCreateRequest): Promise<SchoolResponse> => {
    const response = await api.post<SchoolResponse>('/schools/', data);
    return response.data;
};

/**
 * Update school (SUPER_ADMIN only)
 */
export const updateSchool = async (
    schoolId: number, 
    data: SchoolUpdateRequest
): Promise<SchoolResponse> => {
    const response = await api.patch<SchoolResponse>(`/schools/${schoolId}/`, data);
    return response.data;
};

/**
 * Soft delete school (SUPER_ADMIN only)
 */
export const deleteSchool = async (schoolId: number): Promise<void> => {
    await api.delete(`/schools/${schoolId}`);
};

// ==================== Branches API ====================

/**
 * Get paginated list of branches
 * Can filter by school_id
 */
export const getBranches = async (schoolId: number, params?: PaginationParams): Promise<PaginatedResponse<BranchResponse>> => {
    const response = await api.get<
        PaginatedResponse<BranchResponse>
    >(`/schools/${schoolId}/branches/`, {
        params,
    });
    return response.data;
};

/**
 * Get single branch by ID
 */
export const getBranch = async (branchId: number): Promise<BranchResponse> => {
    const response = await api.get<BranchResponse>(`/branches/${branchId}/`);
    return response.data;
};

/**
 * Create new branch
 */
export const createBranch = async (
    schoolId: number,
    data: BranchCreateRequest
): Promise<BranchResponse> => {
    const response = await api.post<BranchResponse>(
        `/schools/${schoolId}/`,
        data
    );
    return response.data;
};

/**
 * Update branch
 */
export const updateBranch = async (
    schoolId: number,
    branchId: number,
    data: BranchUpdateRequest
): Promise<BranchResponse> => {
    const response = await api.patch<BranchResponse>(
        `/schools/${schoolId}/branches/${branchId}/`,
        data
    );
    return response.data;
};

/**
 * Soft delete branch
 */
export const deleteBranch = async (schoolId: number, branchId: number): Promise<void> => {
    await api.delete(`/schools/${schoolId}/branches/${branchId}/`);
};