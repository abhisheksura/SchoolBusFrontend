// core/api/queryClient.ts
// Singleton TanStack Query client shared across the entire app.

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: import.meta.env.PROD,
            staleTime: 2 * 60 * 1000,       // 2 minutes
            gcTime: 10 * 60 * 1000,          // 10 minutes
            retry: 2,
            retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
        },
        mutations: {
            retry: 0,
        },
    },
});