// core/api/client.ts
// Central Axios instance used by every module's API layer.
//
// Interceptors:
//   - Request  : attach access token from auth store
//   - Response : silent token refresh on 401; skip for /auth/ routes

import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/modules/auth/store";
import { refreshTokenApi } from "@/modules/auth/api";

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

export const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",
    timeout: 15_000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    withCredentials: true,
});

// ---------------------------------------------------------------------------
// Request interceptor — attach access token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — silent refresh on 401
// ---------------------------------------------------------------------------

interface RetryableRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryableRequestConfig;

        const is401 = error.response?.status === 401;
        const alreadyRetried = originalRequest._retry === true;

        // Skip refresh for any /auth/ route — a 401 from /auth/login is bad
        // credentials, not an expired token. Intercepting it here would swallow
        // the error before the login page catch block can show it to the user.
        const isAuthCall = originalRequest.url?.includes("/auth/");

        if (is401 && !alreadyRetried && !isAuthCall) {
            originalRequest._retry = true;

            try {
                const { access_token } = await refreshTokenApi();
                useAuthStore.setState({ accessToken: access_token });

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }
                return apiClient(originalRequest);
            } catch (_refreshError) {
                useAuthStore.getState().clearAuth();
                window.location.replace("/auth/login");
                return Promise.reject(_refreshError);
            }
        }

        return Promise.reject(error);
    }
);