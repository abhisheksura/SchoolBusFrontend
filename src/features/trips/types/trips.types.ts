
// src/features/trips/types/trip.types.ts
//
// TypeScript types for the Trips module.
// Every shape mirrors the corresponding backend Pydantic schema exactly.
//
// Status transition rules (enforced by backend service):
//   SCHEDULED   → IN_PROGRESS | CANCELLED
//   IN_PROGRESS → COMPLETED   | CANCELLED
//   COMPLETED   → terminal (no further transitions)
//   CANCELLED   → terminal (no further transitions)

import type { TripStatus, TripType } from "../constants";

// ---------------------------------------------------------------------------
// Trip
// ---------------------------------------------------------------------------
 
/** Mirrors backend TripResponse. */
export interface TripResponse {
    trip_id          : number;
    school_id        : number;
    branch_id        : number;
    route_id         : number;
    bus_id           : number | null;
    driver_id        : number | null;
    service_date     : string;       // ISO date e.g. "2025-06-15"
    trip_type        : TripType;
    trip_status      : TripStatus;
    actual_start_time: string | null; // ISO-8601 datetime
    actual_end_time  : string | null;
    created_at       : string;
    updated_at       : string;
}

/**
 * POST /trips/trips/
 * bus_id and driver_id are optional at creation — assign later via PATCH /assign.
 */
export interface TripCreateRequest {
    school_id   : number;
    branch_id   : number;
    route_id    : number;
    service_date: string;       // ISO date string "YYYY-MM-DD"
    trip_type   : TripType;
    bus_id      ?: number | null;
    driver_id   ?: number | null;
}
 
/**
 * PATCH /trips/{trip_id}/assign
 * Assigns or reassigns bus / driver to a SCHEDULED trip.
 * At least one of bus_id or driver_id must be provided.
 */
export interface TripAssignAssetsRequest {
    bus_id   ?: number | null;
    driver_id?: number | null;
}
 
/**
 * PATCH /trips/{trip_id}/status
 * Valid transitions enforced server-side — see status rules above.
 */
export interface TripUpdateStatusRequest {
    trip_status: TripStatus;
}
 
/** Query params for GET /trips/trips/ */
export interface TripFilters {
    school_id   : number;
    branch_id   : number;
    page        ?: number;
    page_size   ?: number;
    service_date?: string;          // "YYYY-MM-DD"
    trip_status ?: TripStatus;
    route_id    ?: number;
}
