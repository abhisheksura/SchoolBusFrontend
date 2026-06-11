// src/features/routes/types/routes.types.ts

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