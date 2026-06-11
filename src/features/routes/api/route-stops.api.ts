// /src/features/routes/api/route-stops.api.ts
// ===========================================================================
// Route-Stop membership
// ===========================================================================
import { apiClient } from "@/core";
import type {
    RouteStop,
    RouteStopCreateRequest,
    RouteStopUpdateRequest,
    RouteStopReorderRequest,
} from "../types";

/**
 * Get all route-stop memberships for a route.
 * Each RouteStop includes:
 * - stop_type (PICKUP/DROPOFF)
 * - stop_sequence
 * - stop details
 */
export const getRouteWithStops = async (
    routeId: number,
    schoolId: number,
    branchId: number,
): Promise<RouteStop[]> => {
    const { data } = await apiClient.get<RouteStop[]>(
        `/routes/${routeId}/stops/`,
        {
            params: {
                school_id: schoolId,
                branch_id: branchId
            } 
        },
    );
    return data.slice().sort((a, b) => {
        if (a.trip_type !== b.trip_type) {
            return a.trip_type === "PICKUP" ? -1 : 1;
        }
        return a.stop_sequence - b.stop_sequence;
    });
};
 

/**
 * Add a stop to a route at a specific sequence position.
 * The caller must compute a non-conflicting stop_sequence
 * (e.g. max existing sequence + 1).
 */
export const addStopToRoute = async (
    payload: RouteStopCreateRequest,
): Promise<RouteStop> => {
    const { data } = await apiClient.post<RouteStop>("/route-stops", payload);
    return data;
};

/**
 * Update the sequence number of a stop within a route.
 * Prefer reorderRouteStops() for bulk reordering.
 */
export const updateRouteStop = async (
    routeStopId: number,
    payload    : RouteStopUpdateRequest,
): Promise<RouteStop> => {
    const { data } = await apiClient.put<RouteStop>(
        `/route-stops/${routeStopId}`,
        payload,
    );
    return data;
};

/**
 * Remove a stop from a route entirely.
 * The underlying Stop record is unaffected — only membership is deleted.
 */
export const removeStopFromRoute = async (routeStopId: number): Promise<void> => {
    await apiClient.delete(`/route-stops/${routeStopId}`);
};

/**
 * Bulk-reorder all stops of a given type on a route.
 * Backend assigns stop_sequence = 1, 2, 3 … in the submitted order.
 */
export const reorderRouteStops = async (
    routeId: number,
    payload: RouteStopReorderRequest,
): Promise<void> => {
    await apiClient.post(`/routes/${routeId}/reorder-stops`, payload);
};