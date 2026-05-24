// modules/users/types/index.ts
// TypeScript interfaces for the Driver domain.
// All shapes mirror the backend Pydantic schemas exactly —
// field names are snake_case, nullable fields use `| null`,
// optional fields use `?`.
//
// Multi-tenancy contract:
//   - Every entity carries school_id + branch_id
//   - CreateRequest MUST include school_id + branch_id
//   - UpdateRequest MUST NOT include school_id + branch_id (immutable)

// ---------------------------------------------------------------------------
// Core Driver entity — matches DriverResponse from backend
// ---------------------------------------------------------------------------

export interface DriverResponse {
    driver_id    : number;
    user_id      : number | null;   // linked platform user account (optional)
    school_id    : number;          // tenant scope
    branch_id    : number;          // tenant scope
    school_name  : string;          // denormalised from TenantResponse
    branch_name  : string;          // denormalised from TenantResponse
    first_name   : string;
    last_name    : string | null;
    phone        : string | null;
    license_number: string | null;
    is_active    : boolean;
    created_at   : string;          // ISO-8601 string
    updated_at   : string;
}

// ---------------------------------------------------------------------------
// Driver with enriched relational data (used on the detail panel)
// ---------------------------------------------------------------------------

export interface DriverWithDetails extends DriverResponse {
    /** The trip currently assigned to this driver, if any. */
    current_trip: {
        trip_id   : number;
        route_name: string;
        trip_type : "PICKUP" | "DROPOFF";
        status    : "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    } | null;

    /** Aggregate statistics for this driver. */
    stats: {
        total_trips    : number;
        completed_trips: number;
        cancelled_trips: number;
    } | null;
}

// ---------------------------------------------------------------------------
// API request shapes
// ---------------------------------------------------------------------------

/**
 * Payload for POST /drivers
 * school_id and branch_id are REQUIRED (multi-tenancy).
 */
export interface DriverCreateRequest {
    school_id      : number;
    branch_id      : number;
    first_name     : string;
    last_name      ?: string | null;
    phone          ?: string | null;
    license_number ?: string | null;
    user_id        ?: number | null;  // optionally link a platform user
}

/**
 * Payload for PUT /drivers/{id}
 * school_id and branch_id are intentionally excluded — they are immutable.
 */
export interface DriverUpdateRequest {
    first_name     ?: string;
    last_name      ?: string | null;
    phone          ?: string | null;
    license_number ?: string | null;
    is_active      ?: boolean;
}

// ---------------------------------------------------------------------------
// Query / filter params for GET /drivers
// ---------------------------------------------------------------------------

export interface DriverFilters {
    school_id ?: number;
    branch_id ?: number;
    is_active ?: boolean;
    search    ?: string;   // ILIKE on first_name, last_name, license_number
    page      ?: number;
    page_size ?: number;
}

export interface CreateDriverPayload {
    data: DriverCreateRequest;
}

export interface UpdateDriverPayload {
    id: number;
    data: DriverUpdateRequest;
}