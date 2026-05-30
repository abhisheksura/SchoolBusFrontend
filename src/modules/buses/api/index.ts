// modules/buses/api/index.ts

import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    BusResponse,
    BusCreateRequest,
    BusUpdateRequest,
    BusListParams,
} from "../types";

export async function getBuses(
    schoolId: number | undefined,
    params: BusListParams,
): Promise<PaginatedResponse<BusResponse>> {
    // SUPER_ADMIN has no school binding — use the global endpoint
    // Everyone else uses the school-scoped endpoint
    const url = schoolId !== undefined
        ? `/fleet/schools/${schoolId}/buses/`
        : `/fleet/buses/`;
    const { data } = await apiClient.get<PaginatedResponse<BusResponse>>(url, { params });
    return data;
}

export async function getBus(
    schoolId: number,
    busId: number,
): Promise<BusResponse> {
    const { data } = await apiClient.get<BusResponse>(
        `/fleet/schools/${schoolId}/buses/${busId}`,
    );
    return data;
}

export async function createBus(
    schoolId: number,
    payload: BusCreateRequest,
): Promise<BusResponse> {
    const { data } = await apiClient.post<BusResponse>(
        `/fleet/schools/${schoolId}/buses/`,
        payload,
    );
    return data;
}

export async function updateBus(
    schoolId: number,
    busId: number,
    payload: BusUpdateRequest,
): Promise<BusResponse> {
    const { data } = await apiClient.patch<BusResponse>(
        `/fleet/schools/${schoolId}/buses/${busId}`,
        payload,
    );
    return data;
}

export async function deactivateBus(
    schoolId: number,
    busId: number,
): Promise<BusResponse> {
    const { data } = await apiClient.delete<BusResponse>(
        `/fleet/schools/${schoolId}/buses/${busId}`,
    );
    return data;
}