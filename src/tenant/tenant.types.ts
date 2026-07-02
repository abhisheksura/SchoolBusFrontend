
export interface TenantScopeRequest {
    school_id: number;
    branch_id: number;
}

/** Query params for GET /buses */
export interface TenantFilters {
    school_id  ?: number;
    branch_id  ?: number;
    active_only?: boolean;
    search     ?: string;   // ILIKE on route_code + route_name
    page       ?: number;
    page_size  ?: number;
}