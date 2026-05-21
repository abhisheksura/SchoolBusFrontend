// src/modules/routes/api/index.ts

import api from '@/core/api/client';
import type { PaginatedResponse, PaginationParams } from '../../../core/types/pagination';
import type {
    Route,
    RouteCreateRequest,
    RouteUpdateRequest,
    Stop,
    StopCreateRequest,
    StopUpdateRequest,
    RouteStop,
    RouteStopCreateRequest,
    RouteStopUpdateRequest,
    RouteWithStops,
} from '../types';

// ==================== Routes API ====================

/**
 * Get paginated list of routes
 */
export const getRoutes = async (params?: PaginationParams): Promise<PaginatedResponse<Route>> => {
    const response = await api.get<PaginatedResponse<Route>>('/routes', { params });
    return response.data;
};

/**
 * Get single route by ID
 */
export const getRoute = async (routeId: number): Promise<Route> => {
    const response = await api.get<Route>(`/routes/${routeId}`);
    return response.data;
};

/**
 * Get route with all stops (pickup and dropoff)
 */
export const getRouteWithStops = async (routeId: number): Promise<RouteWithStops> => {
    const response = await api.get<RouteWithStops>(`/routes/${routeId}/stops`);
    return response.data;
};

/**
 * Create new route
 */
export const createRoute = async (data: RouteCreateRequest): Promise<Route> => {
    const response = await api.post<Route>('/routes', data);
    return response.data;
};

/**
 * Update route
 */
export const updateRoute = async (
    routeId: number,
    data: RouteUpdateRequest
): Promise<Route> => {
    const response = await api.put<Route>(`/routes/${routeId}`, data);
    return response.data;
};

/**
 * Soft delete route
 */
export const deleteRoute = async (routeId: number): Promise<void> => {
    await api.delete(`/routes/${routeId}`);
};

// ==================== Stops API ====================

/**
 * Get paginated list of stops
 */
export const getStops = async (params?: PaginationParams): Promise<PaginatedResponse<Stop>> => {
    const response = await api.get<PaginatedResponse<Stop>>('/stops', { params });
    return response.data;
};

/**
 * Get single stop by ID
 */
export const getStop = async (stopId: number): Promise<Stop> => {
    const response = await api.get<Stop>(`/stops/${stopId}`);
    return response.data;
};

/**
 * Create new stop
 */
export const createStop = async (data: StopCreateRequest): Promise<Stop> => {
    const response = await api.post<Stop>('/stops', data);
    return response.data;
};

/**
 * Update stop
 */
export const updateStop = async (
    stopId: number,
    data: StopUpdateRequest
): Promise<Stop> => {
    const response = await api.put<Stop>(`/stops/${stopId}`, data);
    return response.data;
};

/**
 * Soft delete stop
 */
export const deleteStop = async (stopId: number): Promise<void> => {
    await api.delete(`/stops/${stopId}`);
};

// ==================== Route Stops API ====================

/**
 * Get all stops for a route (grouped by type)
 */
export const getRouteStops = async (routeId: number): Promise<RouteStop[]> => {
    const response = await api.get<RouteStop[]>(`/routes/${routeId}/route-stops`);
    return response.data;
};

/**
 * Add stop to route
 */
export const addStopToRoute = async (data: RouteStopCreateRequest): Promise<RouteStop> => {
    const response = await api.post<RouteStop>('/route-stops', data);
    return response.data;
};

/**
 * Update route stop (mainly for reordering)
 */
export const updateRouteStop = async (
    routeStopId: number,
    data: RouteStopUpdateRequest
): Promise<RouteStop> => {
    const response = await api.put<RouteStop>(`/route-stops/${routeStopId}`, data);
    return response.data;
};

/**
 * Remove stop from route
 */
export const removeStopFromRoute = async (routeStopId: number): Promise<void> => {
    await api.delete(`/route-stops/${routeStopId}`);
};

/**
 * Bulk reorder stops for a route
 */
export const reorderRouteStops = async (
    routeId: number,
    stopType: 'PICKUP' | 'DROPOFF',
    stopIds: number[]
): Promise<void> => {
    await api.post(`/routes/${routeId}/reorder-stops`, {
        stop_type: stopType,
        stop_ids: stopIds,
    });
};