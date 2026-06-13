
import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";

import type {
    ParentResponse,
    ParentCreateRequest,
    ParentUpdateRequest,
    ParentFilters
} from "../types";
// =============================================================================
// Parents
// =============================================================================
 
/**
 * Fetch a paginated list of parents for a school.
 * Parents are school-scoped (no branch_id filter).
 *
 * @param filters - Must include school_id.
 */
export const getParents = async (
    filters: ParentFilters,
): Promise<PaginatedResponse<ParentResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<ParentResponse>>(
        "/students/parents/",
        { params: filters },
    );
    return data;
};
 
/**
 * Fetch a single parent by primary key.
 * school_id is required as a query param.
 */
export const getParent = async (
    parentId : number,
    schoolId : number,
): Promise<ParentResponse> => {
    const { data } = await apiClient.get<ParentResponse>(
        `/students/parents/${parentId}`,
        { params: { school_id: schoolId } },
    );
    return data;
};
 
/**
 * Create a new parent.
 * school_id + user_id are required in the body.
 */
export const createParent = async (
    payload: ParentCreateRequest,
): Promise<ParentResponse> => {
    const { data } = await apiClient.post<ParentResponse>(
        "/students/parents/",
        payload,
    );
    return data;
};
 
/**
 * Partially update a parent.
 * school_id / user_id are NOT accepted (immutable).
 */
export const updateParent = async (
    parentId : number,
    schoolId : number,
    payload  : ParentUpdateRequest,
): Promise<ParentResponse> => {
    const { data } = await apiClient.patch<ParentResponse>(
        `/students/parents/${parentId}`,
        payload,
        { params: { school_id: schoolId } },
    );
    return data;
};
 
/**
 * Soft-delete a parent (sets is_active = false).
 */
export const deactivateParent = async (
    parentId : number,
    schoolId : number,
): Promise<ParentResponse> => {
    const { data } = await apiClient.delete<ParentResponse>(
        `/students/parents/${parentId}`,
        { params: { school_id: schoolId } },
    );
    return data;
};