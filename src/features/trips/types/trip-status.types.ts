// src/features/trips/types/trip-status.types.ts

import type { TripStatus } from "../constants";

// ---------------------------------------------------------------------------
// TripLiveStatus
// ---------------------------------------------------------------------------
 
/** Mirrors backend TripLiveStatusResponse. */
export interface TripLiveStatusResponse {
    live_status_id        : number;
    trip_id               : number;
    school_id             : number;
    branch_id             : number;
    current_latitude      : number;
    current_longitude     : number;
    speed                 : number | null;
    heading               : number | null;
    last_stop_id          : number | null;
    last_stop_arrival_time: string | null;
    last_updated          : string;
}
 
// ---------------------------------------------------------------------------
// Allowed status transitions — used by the UI to show / hide action buttons
// ---------------------------------------------------------------------------
 
export const TRIP_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
    SCHEDULED  : ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED",   "CANCELLED"],
    COMPLETED  : [],
    CANCELLED  : [],
} as const;