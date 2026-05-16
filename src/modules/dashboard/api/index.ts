// modules/dashboard/api/index.ts

import apiClient from "@/core/api/client";
import type { DashboardStats, TripSummary, RecentNotification } from "../types";
import type { PaginatedResponse } from "@/core/types/pagination";

export async function getDashboardStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
    return data;
}

export async function getTodayTrips(params: {
    school_id?: number;
    branch_id?: number;
}): Promise<TripSummary[]> {
    const { data } = await apiClient.get<TripSummary[]>("/dashboard/trips/today", { params });
    return data;
}

export async function getRecentNotifications(params: {
    page?: number;
    page_size?: number;
}): Promise<PaginatedResponse<RecentNotification>> {
    const { data } = await apiClient.get<PaginatedResponse<RecentNotification>>(
        "/notifications/my",
        { params }
    );
    return data;
}