// src/modules/schools/api/index.ts

import api from '../../../core/api/client';
import type { PaginatedResponse, PaginationParams } from '../../../core/types/pagination';
import type {
    School, 
    Branch,
    SchoolCreateRequest, 
    SchoolUpdateRequest,
    BranchCreateRequest,
    BranchUpdateRequest 
} from '../types';

// ==================== Schools API ====================

/**
 * Get paginated list of schools
 * SUPER_ADMIN: sees all schools
 * SCHOOL_ADMIN: sees only their school
 */
export const getSchools = async (params?: PaginationParams): Promise<PaginatedResponse<School>> => {
    const response = await api.get<PaginatedResponse<School>>('/schools', { params });
    return response.data;
};

/**
 * Get single school by ID
 */
export const getSchool = async (schoolId: number): Promise<School> => {
    const response = await api.get<School>(`/schools/${schoolId}`);
    return response.data;
};

/**
 * Create new school (SUPER_ADMIN only)
 */
export const createSchool = async (data: SchoolCreateRequest): Promise<School> => {
    const response = await api.post<School>('/schools', data);
    return response.data;
};

/**
 * Update school (SUPER_ADMIN only)
 */
export const updateSchool = async (
    schoolId: number, 
    data: SchoolUpdateRequest
): Promise<School> => {
    const response = await api.put<School>(`/schools/${schoolId}`, data);
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
export const getBranches = async (params?: PaginationParams): Promise<PaginatedResponse<Branch>> => {
    const response = await api.get<PaginatedResponse<Branch>>('/branches', { params });
    return response.data;
};

/**
 * Get single branch by ID
 */
export const getBranch = async (branchId: number): Promise<Branch> => {
    const response = await api.get<Branch>(`/branches/${branchId}`);
    return response.data;
};

/**
 * Create new branch
 */
export const createBranch = async (data: BranchCreateRequest): Promise<Branch> => {
    const response = await api.post<Branch>('/branches', data);
    return response.data;
};

/**
 * Update branch
 */
export const updateBranch = async (
    branchId: number, 
    data: BranchUpdateRequest
): Promise<Branch> => {
    const response = await api.put<Branch>(`/branches/${branchId}`, data);
    return response.data;
};

/**
 * Soft delete branch
 */
export const deleteBranch = async (branchId: number): Promise<void> => {
    await api.delete(`/branches/${branchId}`);
};