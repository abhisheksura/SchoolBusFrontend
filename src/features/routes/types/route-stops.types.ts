// ---------------------------------------------------------------------------
// RouteStop — ordered stop membership on a Route
// ---------------------------------------------------------------------------
import type { TripType } from "./common.types";
import type { StopResponse } from "./stops.types";
import type { RouteResponse } from "./routes.types";
/**
 * A single stop's membership in a route:
 * it carries its position (stop_sequence) and which trip direction
 * (PICKUP / DROPOFF) it belongs to.
 */
export interface RouteStop2 {
    route_stop_id : number;
    route_id      : number;
    stop_id       : number;
    stop_type     : TripType;
    stop_sequence : number;   // 1-based within (route_id, stop_type)
    created_at    : string;
    updated_at    : string;
    stop          : StopResponse;     // always populated when fetched via RouteWithStops
}

export interface RouteStop {
    route_stop_id  : number;
    route_id       : number;
    stop_id        : number;
    stop_name      : string;
    school_id      : number;
    branch_id      : number;
    trip_type      : TripType;      // "PICKUP" | "DROPOFF"
    stop_sequence  : number;        // 1-based within (route_id, trip_type)
    estimated_time : string | null; // ISO-8601 time string or null
    created_at     : string;
    updated_at     : string;
}
/**
 * RouteStop enriched with its resolved Stop details.
 *
 * Built client-side by merging RouteStop + StopResponse.
 * Used exclusively by the RouteStopsPage for rendering — never sent to the API.
 *
 * Construction pattern:
 *   const stopMap = new Map(stops.map(s => [s.stop_id, s]));
 *   const enriched: RouteStopWithDetails = {
 *       ...routeStop,
 *       stop: stopMap.get(routeStop.stop_id)!,
 *   };
 */
export interface RouteStopWithDetails extends RouteStop {
    stop: StopResponse;
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

/**
 * Route enriched with ordered stop lists — used by the stops modal.
 * pickup_stops and dropoff_stops are pre-sorted by stop_sequence.
 */
export interface RouteWithStops extends RouteResponse {
    pickup_stops : RouteStop[];
    dropoff_stops: RouteStop[];
    total_stops  : number;
}

export interface RouteWithStopsResponse {
    route_id: number;
    route_name: string;
    route_code: string;
    is_active: boolean;

    stops: StopResponse[];
}
