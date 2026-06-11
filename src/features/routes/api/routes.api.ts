// src/features/routes/api/routes.api.ts

import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    RouteResponse,
    RouteWithStops,
    RouteCreateRequest,
    RouteUpdateRequest,
    RouteFilters,
} from "../types";

export const getRoutes = async (
    filters?: RouteFilters,
): Promise<PaginatedResponse<RouteResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<RouteResponse>>(
        "/routes/",
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
