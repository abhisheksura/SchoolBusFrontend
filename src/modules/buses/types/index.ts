// modules/buses/types/index.ts

import type { TenantInfo } from "@/core/types/tenant";

export interface BusResponse extends TenantInfo {
    bus_id    : number;
    bus_number: string;
    capacity  : number;
    is_active : boolean;
    created_at: string;
    updated_at: string;
}

export interface BusCreateRequest {
    branch_id : number;
    bus_number: string;
    capacity  : number;
}

export interface BusUpdateRequest {
    bus_number?: string;
    capacity  ?: number;
    branch_id ?: number;  // SCHOOL_ADMIN / SUPER_ADMIN can move bus to another branch
}

export interface BusListParams {
    branch_id ?: number;
    active_only?: boolean;
    page      ?: number;
    page_size ?: number;
    search    ?: string;
}