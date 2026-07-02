// modules/buses/api/index.ts

import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    BusResponse,
    BusCreateRequest,
    BusUpdateRequest,
} from "../types";
import type { TenantFilters, TenantScopeRequest } from "@/tenant"

export const getBuses = async(
    filters?: TenantFilters
): Promise<PaginatedResponse<BusResponse>>  => {
    // SUPER_ADMIN has no school binding — use the global endpoint
    // Everyone else uses the school-scoped endpoint

    const { data } = await apiClient.get<PaginatedResponse<BusResponse>>(
        "/buses/",
        { params: filters });
    return data;
}

/** Fetch a single bus by primary key (no stop data). */
export const getBus = async (busId: number): Promise<BusResponse> => {
    const { data } = await apiClient.get<BusResponse>(`/buses/${busId}`);
    return data;
};


/**
 * Create a new route.
 * school_id and branch_id are required for multi-tenancy.
 */
export const createBus = async (
    payload: BusCreateRequest,
): Promise<BusResponse> => {
    const { data } = await apiClient.post<BusResponse>("/buses", payload);
    return data;
};

/**
 * Update mutable fields on an existing route.
 * school_id / branch_id excluded — immutable after creation.
 */
export const updateBus = async (
    busId    : number,
    schoolId : number,
    branchId : number,
    payload  : BusUpdateRequest,
): Promise<BusResponse> => {
    const { data } = await apiClient.patch<BusResponse>(
        `/buses/${busId}`,
        payload,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};

/**
 * Soft-delete a route (sets is_active = false).
 * Returns the updated Route record.
 */
export const deactivateBus = async(
    busId: number,
    scope: TenantScopeRequest
): Promise<BusResponse> => {
    const { data } = await apiClient.patch<BusResponse>(
        `/buses/${busId}/deactivate`,
        scope,
    );
    return data;
};

export const reactivateBus = async(
    busId: number,
    scope: TenantScopeRequest
): Promise<BusResponse> => {
    const { data } = await apiClient.patch<BusResponse>(
        `/buses/${busId}/reactivate`,
        scope,
    );
    return data;
};