// src/modules/drivers/api/index.ts

import api from '../../../core/api/client';
import type { PaginatedResponse } from '../../../core/types/pagination';
import type {
    Driver,
    DriverCreateRequest,
    DriverUpdateRequest,
    DriverFilters,
    DriverWithDetails,
} from '../types';

/**
 * Get paginated list of drivers with tenant filtering
 * - SUPER_ADMIN: sees all drivers
 * - SCHOOL_ADMIN: sees drivers in their school (all branches)
 * - BRANCH_ADMIN: sees drivers in their branch only
 */
export const getDrivers = async (filters?: DriverFilters): Promise<PaginatedResponse<Driver>> => {
    const response = await api.get<PaginatedResponse<Driver>>('/drivers', { 
        params: filters 
    });
    return response.data;
};

/**
 * Get single driver by ID
 */
export const getDriver = async (driverId: number): Promise<DriverWithDetails> => {
    const response = await api.get<DriverWithDetails>(`/drivers/${driverId}`);
    return response.data;
};

/**
 * Create new driver
 * Requires school_id and branch_id in request
 */
export const createDriver = async (data: DriverCreateRequest): Promise<Driver> => {
    const response = await api.post<Driver>('/drivers', data);
    return response.data;
};

/**
 * Update driver
 */
export const updateDriver = async (
    driverId: number,
    data: DriverUpdateRequest
): Promise<Driver> => {
    const response = await api.put<Driver>(`/drivers/${driverId}`, data);
    return response.data;
};

/**
 * Soft delete driver (set is_active = false)
 */
export const deleteDriver = async (driverId: number): Promise<void> => {
    await api.delete(`/drivers/${driverId}`);
};

/**
 * Get available drivers for assignment
 * Returns drivers that are active and not currently assigned to a trip
 */
export const getAvailableDrivers = async (filters?: {
    school_id?: number;
    branch_id?: number;
    date?: string;
}): Promise<Driver[]> => {
    const response = await api.get<Driver[]>('/drivers/available', { 
        params: filters 
    });
    return response.data;
};

/**
 * Get driver statistics
 */
export const getDriverStats = async (driverId: number): Promise<{
    total_trips: number;
    completed_trips: number;
    cancelled_trips: number;
    average_rating: number;
}> => {
    const response = await api.get(`/drivers/${driverId}/statistics`);
    return response.data;
};