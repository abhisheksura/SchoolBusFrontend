// src/features/assignments/types/index.ts
//
// TypeScript types for the Assignments module.
// Mirrors backend StudentRouteAssignmentCreate / StudentRouteAssignmentResponse
// exactly — field names are snake_case, nullable fields use `| null`.
//
// Domain rules (enforced by backend):
//   • A student needs TWO assignments per route — one for PICKUP, one for DROPOFF.
//   • Each assignment links one student → one route → one boarding stop.
//   • There is no update endpoint — assignments are either active or deactivated.
//   • Deactivation is soft-delete: is_active = false.
//   • school_id + branch_id are required on every read and write.

export type AssignmentType = "PICKUP" | "DROPOFF";

// ---------------------------------------------------------------------------
// Core response shape — mirrors backend StudentRouteAssignmentResponse
// ---------------------------------------------------------------------------

export interface AssignmentResponse {
    assignment_id  : number;
    school_id      : number;
    branch_id      : number;
    student_id     : number;
    route_id       : number;
    stop_id        : number;
    assignment_type: AssignmentType;
    is_active      : boolean;
    assigned_at    : string;   // ISO-8601
    updated_at     : string;
}

// ---------------------------------------------------------------------------
// Create request — mirrors backend StudentRouteAssignmentCreate
// ---------------------------------------------------------------------------

/**
 * POST /assignments/
 * A separate call is needed for PICKUP and DROPOFF.
 * school_id + branch_id are REQUIRED (multi-tenancy).
 */
export interface AssignmentCreateRequest {
    school_id      : number;
    branch_id      : number;
    student_id     : number;
    route_id       : number;
    stop_id        : number;
    assignment_type: AssignmentType;
}

// ---------------------------------------------------------------------------
// Filter params for the two GET endpoints
// ---------------------------------------------------------------------------

/**
 * GET /assignments/student/:student_id
 * Returns all assignments (PICKUP + DROPOFF) for a student.
 * Backend returns a plain array, not paginated.
 */
export interface StudentAssignmentFilters {
    school_id  : number;
    branch_id  : number;
    active_only?: boolean;
}

/**
 * GET /assignments/route/:route_id
 * Returns paginated assignments for a route.
 * Optionally filter by assignment_type (PICKUP | DROPOFF).
 */
export interface RouteAssignmentFilters {
    school_id      : number;
    branch_id      : number;
    page          ?: number;
    page_size     ?: number;
    assignment_type?: AssignmentType;
    active_only   ?: boolean;
}

// ---------------------------------------------------------------------------
// Enriched view — used for display only, never sent to API
// ---------------------------------------------------------------------------

/**
 * AssignmentResponse enriched with resolved display names.
 * Built client-side by merging the assignment with cached
 * student / route / stop data already in the React Query cache.
 */
export interface AssignmentWithDetails extends AssignmentResponse {
    student_name: string;   // resolved from students cache
    route_name  : string;   // resolved from routes cache
    stop_name   : string;   // resolved from stops cache
}

// ---------------------------------------------------------------------------
// UI view mode — which pivot the AssignmentsPage is displaying
// ---------------------------------------------------------------------------

export type AssignmentViewMode = "by_student" | "by_route";