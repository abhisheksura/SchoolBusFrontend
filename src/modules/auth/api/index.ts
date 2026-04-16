// modules/auth/api/index.ts
// All HTTP calls for the auth module.

import apiClient from "@/core/api/client";
import type { LoginRequest, TokenResponse, MeResponse } from "../types";

/** POST /api/v1/auth/login */
export async function loginApi(payload: LoginRequest): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
    return data;
}

/**
 * GET /api/v1/auth/me
 * Accepts an optional token so LoginPage can call this before writing to the
 * store — prevents the useEffect redirect race on role validation failure.
 */
export async function getMeApi(token?: string): Promise<MeResponse> {
    const { data } = await apiClient.get<MeResponse>("/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
}

/** POST /api/v1/auth/refresh */
export async function refreshTokenApi(): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/auth/refresh");
    return data;
}

/** POST /api/v1/auth/logout */
export async function logoutApi(): Promise<void> {
    await apiClient.post("/auth/logout");
}