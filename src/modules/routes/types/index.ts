// src/modules/routes/types/index.ts
// TypeScript types for the Routes & Stops domain.
//
// Key additions vs the current stub:
//   • school_name / branch_name on every response (denormalised from backend TenantResponse)
//   • RouteFilters and StopFilters with explicit search / active_only / pagination params
//   • RouteStopReorderRequest for the bulk-reorder endpoint
//
// Multi-tenancy rules (enforced by backend + respected by client):
//   • Every entity carries school_id + branch_id
//   • CreateRequest MUST include school_id + branch_id
//   • UpdateRequest MUST NOT include school_id or branch_id (immutable)

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

/** Whether a stop is on the morning pick-up run or afternoon drop-off run. */
export type TripType = "PICKUP" | "DROPOFF";

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

// ---------------------------------------------------------------------------
// RouteStop — ordered stop membership on a Route
// ---------------------------------------------------------------------------

/**
 * A single stop's membership in a route:
 * it carries its position (stop_sequence) and which trip direction
 * (PICKUP / DROPOFF) it belongs to.
 */
export interface RouteStop {
    route_stop_id : number;
    route_id      : number;
    stop_id       : number;
    stop_type     : TripType;
    stop_sequence : number;   // 1-based within (route_id, stop_type)
    created_at    : string;
    updated_at    : string;
    stop          : StopResponse;     // always populated when fetched via RouteWithStops
}

/** POST /route-stops */
export interface RouteStopCreateRequest {
    route_id     : number;
    stop_id      : number;
    stop_type    : TripType;
    stop_sequence: number;
}

/** PUT /route-stops/:id */
export interface RouteStopUpdateRequest {
    stop_sequence?: number;
}

/** POST /routes/:id/reorder-stops — bulk sequence update */
export interface RouteStopReorderRequest {
    stop_type: TripType;
    /** Ordered array of route_stop_ids in desired sequence (1 → N). */
    stop_ids : number[];
}

// ---------------------------------------------------------------------------
// Route — named sequence of stops
// ---------------------------------------------------------------------------

export interface RouteResponse {
    route_id   : number;
    school_id  : number;
    branch_id  : number;
    school_name: string;   // denormalised
    branch_name: string;   // denormalised
    route_code : string;   // unique per school, e.g. "RT-001"
    route_name : string;
    is_active  : boolean;
    created_at : string;
    updated_at : string;
}

/**
 * Route enriched with ordered stop lists — used by the stops modal.
 * pickup_stops and dropoff_stops are pre-sorted by stop_sequence.
 */
export interface RouteWithStops extends RouteResponse {
    pickup_stops : RouteStop[];
    dropoff_stops: RouteStop[];
    total_stops  : number;
}

/** POST /routes — tenant fields required. */
export interface RouteCreateRequest {
    school_id : number;
    branch_id : number;
    route_code: string;
    route_name: string;
}

/** PUT /routes/:id — tenant fields excluded. */
export interface RouteUpdateRequest {
    route_code?: string;
    route_name?: string;
    is_active ?: boolean;
}

/** Query params for GET /routes */
export interface RouteFilters {
    school_id  ?: number;
    branch_id  ?: number;
    active_only?: boolean;
    search     ?: string;   // ILIKE on route_code + route_name
    page       ?: number;
    page_size  ?: number;
}