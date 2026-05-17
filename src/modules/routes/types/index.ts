// src/modules/routes/types/index.ts

// ==================== Enums ====================
export type TripType = 'PICKUP' | 'DROPOFF';

// ==================== Stop Types ====================
export interface Stop {
    stop_id: number;
    school_id: number;
    branch_id: number;
    stop_name: string;
    stop_latitude: number;
    stop_longitude: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface StopCreateRequest {
    school_id: number;
    branch_id: number;
    stop_name: string;
    stop_latitude: number;
    stop_longitude: number;
}

export interface StopUpdateRequest {
    stop_name?: string;
    stop_latitude?: number;
    stop_longitude?: number;
    is_active?: boolean;
}

// ==================== Route Types ====================
export interface Route {
    route_id: number;
    school_id: number;
    branch_id: number;
    route_code: string;
    route_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface RouteCreateRequest {
    school_id: number;
    branch_id: number;
    route_code: string;
    route_name: string;
}

export interface RouteUpdateRequest {
    route_code?: string;
    route_name?: string;
    is_active?: boolean;
}

// ==================== Route Stop Types ====================
export interface RouteStop {
    route_stop_id: number;
    route_id: number;
    stop_id: number;
    stop_type: TripType;
    stop_sequence: number;
    created_at: string;
    updated_at: string;
    stop?: Stop;
}

export interface RouteStopCreateRequest {
    route_id: number;
    stop_id: number;
    stop_type: TripType;
    stop_sequence: number;
}

export interface RouteStopUpdateRequest {
    stop_sequence?: number;
}

// ==================== Route with Stops ====================
export interface RouteWithStops extends Route {
    pickup_stops?: RouteStop[];
    dropoff_stops?: RouteStop[];
    total_stops?: number;
}

// ==================== Map Location ====================
export interface MapLocation {
    lat: number;
    lng: number;
}

export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}