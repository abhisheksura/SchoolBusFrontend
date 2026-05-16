// modules/dashboard/types/index.ts

export interface DashboardStats {
    total_buses: number;
    active_trips_today: number;
    total_students: number;
    pending_leaves: number;
}

export interface TripSummary {
    trip_id: number;
    route_name: string;
    trip_type: "PICKUP" | "DROPOFF";
    trip_status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    service_date: string;
    bus_number: string | null;
    driver_name: string | null;
    actual_start_time: string | null;
}

export interface RecentNotification {
    notification_id: number;
    title: string;
    message: string;
    notification_type: string;
    notification_status: string;
    sent_at: string;
}