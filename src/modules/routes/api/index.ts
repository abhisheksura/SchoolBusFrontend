// src/modules/routes/api/index.ts
// All HTTP calls for the Routes & Stops domain.
//
// Endpoint map (mirrors backend router at /api/v1/):
//
//   Stops
//     GET    /stops                       paginated list  (tenant-scoped)
//     GET    /stops/:id                   single stop
//     POST   /stops                       create
//     PUT    /stops/:id                   update
//     DELETE /stops/:id                   soft-delete → returns updated Stop
//
//   Routes
//     GET    /routes                      paginated list
//     GET    /routes/:id                  single route (no stops)
//     GET    /routes/:id/stops            route + ordered pickup/dropoff stops
//     POST   /routes                      create
//     PUT    /routes/:id                  update
//     DELETE /routes/:id                  soft-delete → returns updated Route
//
//   Route-Stop membership
//     GET    /route-stops?route_id=:id    stops for a route
//     POST   /route-stops                 add stop to route
//     PUT    /route-stops/:id             update sequence
//     DELETE /route-stops/:id             remove stop from route
//     POST   /routes/:id/reorder-stops    bulk reorder

import apiClient from "@/core/api/client";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    StopResponse,
    StopCreateRequest,
    StopUpdateRequest,
    StopFilters,
    RouteResponse,
    RouteWithStops,
    RouteCreateRequest,
    RouteUpdateRequest,
    RouteFilters,
    RouteStop,
    RouteStopCreateRequest,
    RouteStopUpdateRequest,
    RouteStopReorderRequest,
} from "../types";

// ===========================================================================
// Stops
// ===========================================================================

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

// ===========================================================================
// Routes
// ===========================================================================

/**
 * Fetch a paginated, tenant-scoped list of routes.
 *
 * Role behaviour (enforced server-side):
 *   SUPER_ADMIN  → all routes
 *   SCHOOL_ADMIN → routes within their school
 *   BRANCH_ADMIN → routes within their branch only
 */
export const getRoutes = async (
    filters?: RouteFilters,
): Promise<PaginatedResponse<RouteResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<RouteResponse>>(
        "/routes",
        { params: filters },
    );
    return data;
};

/** Fetch a single route by primary key (no stop data). */
export const getRoute = async (routeId: number): Promise<RouteResponse> => {
    const { data } = await apiClient.get<RouteResponse>(`/routes/${routeId}`);
    return data;
};

/**
 * Fetch a route with its ordered pickup + dropoff stop lists.
 * Used by the Stops modal. Lists are pre-sorted by stop_sequence.
 */
export const getRouteWithStops = async (
    routeId: number,
): Promise<RouteWithStops> => {
    const { data } = await apiClient.get<RouteWithStops>(
        `/routes/${routeId}/stops`,
    );
    return data;
};

/**
 * Create a new route.
 * school_id and branch_id are required for multi-tenancy.
 */
export const createRoute = async (
    payload: RouteCreateRequest,
): Promise<RouteResponse> => {
    const { data } = await apiClient.post<RouteResponse>("/routes", payload);
    return data;
};

/**
 * Update mutable fields on an existing route.
 * school_id / branch_id excluded — immutable after creation.
 */
export const updateRoute = async (
    routeId: number,
    payload: RouteUpdateRequest,
): Promise<RouteResponse> => {
    const { data } = await apiClient.put<RouteResponse>(`/routes/${routeId}`, payload);
    return data;
};

/**
 * Soft-delete a route (sets is_active = false).
 * Returns the updated Route record.
 */
export const deactivateRoute = async (routeId: number): Promise<RouteResponse> => {
    const { data } = await apiClient.delete<RouteResponse>(`/routes/${routeId}`);
    return data;
};

// ===========================================================================
// Route-Stop membership
// ===========================================================================

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