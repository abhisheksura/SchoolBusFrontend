// core/config/env.ts
// Typed access to Vite env variables and app-wide constants.
// Import from here rather than reading import.meta.env directly in modules.

export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string ?? "http://127.0.0.1:8000/api/v1",
    APP_NAME: import.meta.env.VITE_APP_NAME as string ?? "BusTracker",
    IS_PROD: import.meta.env.PROD as boolean,
} as const;

export const PAGE_SIZE = 20;

export const QUERY_STALE_TIME = 2 * 60 * 1000;     // 2 min
export const QUERY_GC_TIME    = 10 * 60 * 1000;    // 10 min