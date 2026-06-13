// =============================================================================
// Parent
// =============================================================================
 
/** Mirrors backend ParentResponse. */
export interface ParentResponse {
    parent_id      : number;
    user_id        : number;
    school_id      : number;
    first_name     : string;
    last_name      : string | null;
    phone          : string | null;
    alternate_phone: string | null;
    email          : string | null;
    address        : string | null;
    is_active      : boolean;
    created_at     : string;
    updated_at     : string;
}
 
/**
 * POST /students/parents/
 * Parents are school-scoped (no branch_id).
 */
export interface ParentCreateRequest {
    school_id      : number;
    user_id        : number;
    first_name     : string;
    last_name      ?: string | null;
    phone          ?: string | null;
    alternate_phone?: string | null;
    email          ?: string | null;
    address        ?: string | null;
}
 
/**
 * PATCH /students/parents/:id
 * school_id / user_id are excluded — immutable.
 */
export interface ParentUpdateRequest {
    first_name     ?: string;
    last_name      ?: string | null;
    phone          ?: string | null;
    alternate_phone?: string | null;
    email          ?: string | null;
    address        ?: string | null;
    is_active      ?: boolean;
}
 
/** Query params for GET /students/parents/ */
export interface ParentFilters {
    school_id  : number;
    active_only?: boolean;
    page       ?: number;
    page_size  ?: number;
}