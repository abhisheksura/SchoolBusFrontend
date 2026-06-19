// /src/features/assignments/api/student-assignments.api.ts

// ---------------------------------------------------------------------------
// Read — by student
// ---------------------------------------------------------------------------
import { apiClient }             from "@/core";
import type {
    AssignmentResponse,
    StudentAssignmentFilters,
} from "../types";
/**
 * Fetch ALL assignments for a specific student (PICKUP + DROPOFF combined).
 * Returns a plain array — this endpoint is not paginated.
 *
 * Role filtering (enforced server-side):
 *   SUPER_ADMIN  → must pass explicit school_id + branch_id
 *   SCHOOL_ADMIN → school_id from JWT, branch_id from caller
 *   BRANCH_ADMIN → both from JWT
 *
 * @param studentId — Student's primary key.
 * @param filters   — Must include school_id + branch_id.
 */
export const getStudentAssignments = async (
    studentId: number,
    filters  : StudentAssignmentFilters,
): Promise<AssignmentResponse[]> => {
    const { data } = await apiClient.get<AssignmentResponse[]>(
        `/assignments/student/${studentId}`,
        { params: filters },
    );
    return data;
};
