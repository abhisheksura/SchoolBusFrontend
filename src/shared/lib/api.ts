// ─── Shared Axios Client ─────────────────────────────────────────────────────
// Central HTTP client used by every feature's API module.
//
// Interceptors handle:
//   • Attaching the Authorization header on every request
//   • Silent token refresh on 401 (retry the original request once)
//   • Redirecting to /auth/login when refresh also fails

import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type InternalAxiosRequestConfig,
} from "axios";
import { refreshTokenApi } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",
    timeout: 15_000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    // Needed for the refresh token httpOnly cookie to be sent cross-origin
    withCredentials: true,
});

// ---------------------------------------------------------------------------
// Request interceptor — attach access token
// ---------------------------------------------------------------------------

api.interceptors.request.use(
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

// Extend Axios config type to carry our retry flag
interface RetryableRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryableRequestConfig;

        const is401 = error.response?.status === 401;
        const alreadyRetried = originalRequest._retry === true;

        // Skip refresh for any auth endpoint — a 401 from /auth/login means
        // bad credentials, not an expired token. Attempting a refresh here
        // would silently swallow the error before handleLogin's catch block
        // ever sees it, causing the error banner to never appear.
        const isAuthCall = originalRequest.url?.includes("/auth/");

        if (is401 && !alreadyRetried && !isAuthCall) {
            originalRequest._retry = true;

            try {
                // Exchange the httpOnly refresh-token cookie for new tokens
                const { access_token } = await refreshTokenApi();

                // Persist the new access token in the store
                useAuthStore.setState({ accessToken: access_token });

                // Retry the original request with the fresh token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }
                return api(originalRequest);
            } catch (_refreshError) {
                // Refresh failed — wipe auth state and send user to login
                useAuthStore.getState().clearAuth();
                window.location.replace("/auth/login");
                return Promise.reject(_refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;