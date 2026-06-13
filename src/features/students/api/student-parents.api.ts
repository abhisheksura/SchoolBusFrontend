
import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    StudentParentResponse,
    StudentParentCreateRequest,
    StudentParentUpdateRequest,
} from "../types";

// =============================================================================
// Student-Parent Links
// =============================================================================
 
/**
 * List all parents linked to a specific student.
 * Returns a plain array (not paginated).
 */
export const getStudentParents = async (
    studentId: number,
    schoolId : number,
    branchId : number,
): Promise<StudentParentResponse[]> => {
    const { data } = await apiClient.get<StudentParentResponse[]>(
        `/students/${studentId}/parents`,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
 
/**
 * Link an existing parent to a student.
 * The parent must already exist (POST /parents/ first if needed).
 */
export const linkParentToStudent = async (
    studentId: number,
    schoolId : number,
    branchId : number,
    payload  : StudentParentCreateRequest,
): Promise<StudentParentResponse> => {
    const { data } = await apiClient.post<StudentParentResponse>(
        `/students/${studentId}/parents`,
        payload,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
 
/**
 * Update relationship label or primary flag on a student-parent link.
 */
export const updateStudentParentLink = async (
    studentId       : number,
    studentParentId : number,
    schoolId        : number,
    branchId        : number,
    payload         : StudentParentUpdateRequest,
): Promise<StudentParentResponse> => {
    const { data } = await apiClient.patch<StudentParentResponse>(
        `/students/${studentId}/parents/${studentParentId}`,
        payload,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
 
/**
 * Remove the relationship between a student and a parent.
 * Neither the student nor the parent record is deleted.
 * Returns 204 No Content (void).
 */
export const unlinkParentFromStudent = async (
    studentId       : number,
    studentParentId : number,
    schoolId        : number,
    branchId        : number,
): Promise<void> => {
    await apiClient.delete(
        `/students/${studentId}/parents/${studentParentId}`,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
};