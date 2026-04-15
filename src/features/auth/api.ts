// Auth API
// All HTTP calls for the auth domain.

import api from "@/shared/lib/api";
import type { LoginRequest, TokenResponse, MeResponse } from "./types";

// POST /api/v1/auth/login
export async function loginApi(payload: LoginRequest): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/login", payload);
    return data;
}

// GET /api/v1/auth/me
// Accepts an optional token so the LoginPage can call this BEFORE writing
// the token to the store -- preventing the useEffect redirect race.
export async function getMeApi(token?: string): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>("/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
}

// POST /api/v1/auth/refresh
export async function refreshTokenApi(): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>("/auth/refresh");
    return data;
}

// POST /api/v1/auth/logout
export async function logoutApi(): Promise<void> {
    await api.post("/auth/logout");
}