// ===========================================================================
// Stops
// ===========================================================================
import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    StopResponse,
    StopCreateRequest,
    StopUpdateRequest,
    StopFilters
} from '../types';

/**
 * Fetch a paginated, tenant-scoped list of stops.
 *
 * Role behaviour (enforced server-side):
 *   SUPER_ADMIN  → all stops
 *   SCHOOL_ADMIN → stops within their school
 *   BRANCH_ADMIN → stops within their branch only
 */
export const getStops = async (
    filters?: StopFilters,
): Promise<PaginatedResponse<StopResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<StopResponse>>(
        "/stops/",
        { params: filters },
    );
    return data;
};

/** Fetch a single stop by primary key. */
export const getStop = async (stopId: number): Promise<StopResponse> => {
    const { data } = await apiClient.get<StopResponse>(`/stops/${stopId}`);
    return data;
};

/**
 * Create a new stop.
 * school_id and branch_id are required for multi-tenancy.
 */
export const createStop = async (
    payload: StopCreateRequest,
): Promise<StopResponse> => {
    const { data } = await apiClient.post<StopResponse>("/stops", payload);
    return data;
};

/**
 * Update mutable fields on a stop.
 * school_id / branch_id excluded — immutable after creation.
 */
export const updateStop = async (
    stopId : number,
    payload: StopUpdateRequest,
): Promise<StopResponse> => {
    console.log("Payload");
    console.log(payload);
    const { data } = await apiClient.patch<StopResponse>(`/stops/${stopId}`, payload);
    return data;
};

/**
 * Soft-delete a stop (sets is_active = false).
 * Returns the updated Stop record.
 */
export const deactivateStop = async (stopId: number): Promise<StopResponse> => {
    const { data } = await apiClient.delete<StopResponse>(`/stops/${stopId}`);
    return data;
};