// src/features/trips/api/index.ts
//
// All HTTP calls for the Trips domain.
//
// Endpoint map (mirrors backend /api/v1/trips/ router):
//
//   POST   /trips/                       create trip
//   GET    /trips/                        list  (school_id + branch_id required)
//   GET    /trips/:id                     single
//   PATCH  /trips/:id/assign              assign bus / driver
//   PATCH  /trips/:id/status              transition status
//   GET    /trips/:id/live-status         live GPS position
//   PUT    /trips/:id/live-status         upsert GPS position (driver / device)
 
import { apiClient }             from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    TripResponse,
    TripCreateRequest,
    TripAssignAssetsRequest,
    TripUpdateStatusRequest,
    TripFilters,
    // TripLiveStatusResponse,
} from "../types";
 
// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------
 
/**
 * Fetch a paginated, tenant-scoped list of trips.
 *
 * Role filtering (enforced server-side):
 *   SUPER_ADMIN  → must pass explicit school_id + branch_id
 *   SCHOOL_ADMIN → school_id from JWT, branch_id from caller
 *   BRANCH_ADMIN → both from JWT
 *
 * ⚠️  Both school_id AND branch_id are REQUIRED — the backend will 422 without them.
 */
export const getTrips = async (
    filters: TripFilters,
): Promise<PaginatedResponse<TripResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<TripResponse>>(
        "/trips/",
        { params: filters },
    );
    return data;
};
 
/**
 * Fetch a single trip.
 * school_id + branch_id required as query params.
 */
export const getTrip = async (
    tripId  : number,
    schoolId: number,
    branchId: number,
): Promise<TripResponse> => {
    const { data } = await apiClient.get<TripResponse>(
        `/trips/${tripId}`,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
 
/**
 * Schedule a new trip.
 * school_id + branch_id are required in the body.
 * bus_id / driver_id are optional — assign later via assignTripAssets().
 */
export const createTrip = async (
    payload: TripCreateRequest,
): Promise<TripResponse> => {
    const { data } = await apiClient.post<TripResponse>("/trips/", payload);
    return data;
};
 
/**
 * Assign or reassign bus / driver to a SCHEDULED trip.
 * At least one of bus_id or driver_id must be provided.
 * Returns 400 if the trip is already IN_PROGRESS or terminal.
 */
export const assignTripAssets = async (
    tripId  : number,
    schoolId: number,
    branchId: number,
    payload : TripAssignAssetsRequest,
): Promise<TripResponse> => {
    const { data } = await apiClient.patch<TripResponse>(
        `/trips/${tripId}/assign`,
        payload,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
 
/**
 * Transition a trip's status.
 * Valid: SCHEDULED → IN_PROGRESS | CANCELLED
 *        IN_PROGRESS → COMPLETED | CANCELLED
 * Server rejects any other transition with 400.
 */
export const updateTripStatus = async (
    tripId  : number,
    schoolId: number,
    branchId: number,
    payload : TripUpdateStatusRequest,
): Promise<TripResponse> => {
    const { data } = await apiClient.patch<TripResponse>(
        `/trips/${tripId}/status`,
        payload,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};
 