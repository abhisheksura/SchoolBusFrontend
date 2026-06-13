// =============================================================================
// Student
// =============================================================================
 
/** Mirrors backend StudentResponse. */
export interface StudentResponse {
    student_id      : number;
    school_id       : number;
    branch_id       : number;
    user_id         : number;
    first_name      : string;
    last_name       : string | null;
    admission_number: string | null;
    grade           : string | null;
    section         : string | null;
    is_active       : boolean;
    created_at      : string;   // ISO-8601
    updated_at      : string;
}
 
/**
 * POST /students/students/
 * school_id + branch_id are REQUIRED (multi-tenancy).
 * user_id is required — every student must have a platform login.
 */
export interface StudentCreateRequest {
    school_id       : number;
    branch_id       : number;
    user_id         : number;
    first_name      : string;
    last_name      ?: string | null;
    admission_number?: string | null;
    grade          ?: string | null;
    section        ?: string | null;
}
 
/**
 * PATCH /students/students/:id
 * school_id / branch_id / user_id are excluded — immutable after creation.
 * At least one field must be provided (validated server-side).
 */
export interface StudentUpdateRequest {
    first_name      ?: string;
    last_name       ?: string | null;
    admission_number?: string | null;
    grade           ?: string | null;
    section         ?: string | null;
    is_active       ?: boolean;
}
 
/** Query params for GET /students/students/ */
export interface StudentFilters {
    school_id  : number;
    branch_id  : number;
    active_only?: boolean;
    page       ?: number;
    page_size  ?: number;
}
 