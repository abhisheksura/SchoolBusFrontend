// ---------------------------------------------------------------------------
// Stop — a physical GPS waypoint (bus stop)
// ---------------------------------------------------------------------------

export interface StopResponse {
    stop_id       : number;
    school_id     : number;
    branch_id     : number;
    school_name   : string;   // denormalised — always populated by backend
    branch_name   : string;   // denormalised — always populated by backend
    stop_name     : string;
    latitude      : number;
    longitude     : number;
    is_active     : boolean;
    created_at    : string;   // ISO-8601
    updated_at    : string;
}

/** POST /stops — school_id + branch_id required (multi-tenancy). */
export interface StopCreateRequest {
    school_id     : number;
    branch_id     : number;
    stop_name     : string;
    latitude      : number;
    longitude     : number;
}

/** PUT /stops/:id — tenant fields excluded (immutable after creation). */
export interface StopUpdateRequest {
    stop_name     ?: string;
    latitude      ?: number;
    longitude     ?: number;
    is_active     ?: boolean;
}

/** Query params for GET /stops */
export interface StopFilters {
    school_id ?: number;
    branch_id ?: number;
    active_only?: boolean;
    search    ?: string;   // ILIKE on stop_name (backend must support this)
    page      ?: number;
    page_size ?: number;
}