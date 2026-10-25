// src/features/assignments/api/assignments.ts
//
// All HTTP calls for the Assignments domain.
//
// Endpoint map (mirrors backend /api/v1/assignments/ router):
//
//   POST   /assignments/                         create assignment
//   GET    /assignments/student/:student_id       all assignments for a student (array, not paginated)
//   GET    /assignments/route/:route_id           paginated assignments for a route
//   DELETE /assignments/:assignment_id            soft-delete (sets is_active = false)
//
// Notes:
//   • There is NO update endpoint — assignments are immutable after creation.
//   • There is NO global list endpoint — you must query by student or by route.
//   • school_id + branch_id are required as query params on every GET and DELETE.

import { apiClient }             from "@/core";
import type {
    AssignmentResponse,
    AssignmentCreateRequest,
    AssignmentUpdateRequest,
} from "../types";
import type { TenantScopeRequest } from "@/tenant"

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Assign a student to a route + boarding stop for a specific trip type.
 *
 * ⚠️  A PICKUP and a DROPOFF assignment are two separate calls —
 *     call this function twice if you need both directions.
 *
 * @param payload — Must include school_id + branch_id (multi-tenancy).
 */
export const createAssignment = async (
    payload: AssignmentCreateRequest,
): Promise<AssignmentResponse> => {
    const { data } = await apiClient.post<AssignmentResponse>(
        "/assignments/",
        payload,
    );
    return data;
};

export const updateAssignment = async (
    assignmentId    : number,
    schoolId : number,
    branchId : number,
    payload  : AssignmentUpdateRequest,
): Promise<AssignmentResponse> => {
    const { data } = await apiClient.patch<AssignmentResponse>(
        `/assignments/${assignmentId}`,
        payload,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
// ---------------------------------------------------------------------------
// Deactivate (soft-delete)
// ---------------------------------------------------------------------------

/**
 * Soft-delete an assignment by setting is_active = false.
 * Returns the updated AssignmentResponse (is_active will be false).
 *
 * ⚠️  There is no reactivate endpoint — once deactivated the student
 *     must be re-assigned via createAssignment().
 *
 * @param assignmentId — Assignment's primary key.
 * @param schoolId     — Required for tenant-scoped access check.
 * @param branchId     — Required for tenant-scoped access check.
 */

export const deactivateAssignment = async (
    assignmentId: number,
    scope: TenantScopeRequest
): Promise<AssignmentResponse> => {
    const { data } = await apiClient.patch<AssignmentResponse>(
        `/assignments/${assignmentId}/deactivate`,
        scope,
    );
    return data;
};

export const reactivateAssignment = async (
    assignmentId: number,
    scope: TenantScopeRequest
): Promise<AssignmentResponse> => {
    const { data } = await apiClient.patch<AssignmentResponse>(
        `/assignments/${assignmentId}/reactivate`,
        scope,
    );
    return data;
};
