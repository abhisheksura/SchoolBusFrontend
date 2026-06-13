
// =============================================================================
// Student-Parent Link
// =============================================================================

import type { ParentResponse } from "./parents.type";

/** Mirrors backend StudentParentResponse. */
export interface StudentParentResponse {
    student_parent_id: number;
    student_id       : number;
    parent_id        : number;
    relationship     : string;   // e.g. "FATHER", "MOTHER", "GUARDIAN"
    is_primary       : boolean;
    created_at       : string;
    updated_at       : string;
}
 
/**
 * POST /students/students/:id/parents
 * Links an existing parent (by parent_id) to a student.
 */
export interface StudentParentCreateRequest {
    parent_id   : number;
    relationship: string;
    is_primary  : boolean;
}
 
/** PATCH /students/students/:id/parents/:student_parent_id */
export interface StudentParentUpdateRequest {
    relationship?: string;
    is_primary  ?: boolean;
}
 
/** Enriched view — StudentParentResponse + resolved ParentResponse for display. */
export interface StudentParentWithDetails extends StudentParentResponse {
    parent: ParentResponse;
}