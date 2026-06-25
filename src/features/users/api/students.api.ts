// =============================================================================
// Students
// =============================================================================
import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    StudentResponse,
    StudentCreateRequest,
    StudentUpdateRequest,
    StudentFilters,
} from "../types";
import type { TenantScopeRequest } from "@/tenant";

/**
 * Fetch a paginated, tenant-scoped list of students.
 *
 * Role filtering (enforced server-side):
 *   SUPER_ADMIN  → all students (pass school_id + branch_id explicitly)
 *   SCHOOL_ADMIN → all students within their school
 *   BRANCH_ADMIN → only students within their branch
 *
 * ⚠️  school_id AND branch_id are REQUIRED query params — the backend
 *     will reject requests missing either one with a 422.
 *
 * @param filters  - Must include school_id + branch_id.
 */
export const getStudents = async (
    filters: StudentFilters,
): Promise<PaginatedResponse<StudentResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<StudentResponse>>(
        "/students/",
        { params: filters },
    );
    return data;
};

/**
 * Fetch a single student by primary key.
 * school_id + branch_id are required as query params.
 */
export const getStudent = async (
    studentId: number,
    schoolId : number,
    branchId : number,
): Promise<StudentResponse> => {
    const { data } = await apiClient.get<StudentResponse>(
        `/students/${studentId}`,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
 
/**
 * Create a new student.
 * school_id + branch_id + user_id are required in the request body.
 */
export const createStudent = async (
    payload: StudentCreateRequest,
): Promise<StudentResponse> => {
    const { data } = await apiClient.post<StudentResponse>(
        "/students/",
        payload,
    );
    return data;
};


/**
 * Partially update a student.
 * school_id / branch_id / user_id are NOT accepted in the update payload
 * (immutable after creation — backend will ignore or reject them).
 */
export const updateStudent = async (
    studentId: number,
    schoolId : number,
    branchId : number,
    payload  : StudentUpdateRequest,
): Promise<StudentResponse> => {
    const { data } = await apiClient.patch<StudentResponse>(
        `/students/${studentId}`,
        payload,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
 
/**
 * Soft-delete a student (sets is_active = false).
 * Returns the updated StudentResponse.
 */
export const deactivateStudent = async(
    studentId: number,
    scope: TenantScopeRequest
): Promise<StudentResponse> => {
    const { data } = await apiClient.patch<StudentResponse>(
        `/students/${studentId}/deactivate`,
        scope,
    );
    return data;
}

export const reactivateStudent = async(
    studentId: number,
    scope: TenantScopeRequest
): Promise<StudentResponse> => {
    const { data } = await apiClient.patch<StudentResponse>(
        `/students/${studentId}/reactivate`,
        scope,
    );
    return data;
}