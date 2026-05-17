// ==================== Driver Types ====================
export interface Driver {
    driver_id: number;
    user_id: number | null;
    school_id: number;
    branch_id: number;
    first_name: string;
    last_name: string | null;
    phone: string | null;
    license_number: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DriverCreateRequest {
    school_id: number;
    branch_id: number;
    first_name: string;
    last_name?: string | null;
    phone?: string | null;
    license_number?: string | null;
    user_id?: number | null;
}

export interface DriverUpdateRequest {
    first_name?: string;
    last_name?: string | null;
    phone?: string | null;
    license_number?: string | null;
    is_active?: boolean;
}

// ==================== Driver with Relations ====================
export interface DriverWithDetails extends Driver {
    full_name?: string;
    current_trip?: {
        trip_id: number;
        route_name: string;
        status: string;
    } | null;
}

// ==================== Filters ====================
export interface DriverFilters {
    school_id?: number;
    branch_id?: number;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
}