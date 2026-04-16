// app/providers/QueryProvider.tsx
// Provides TanStack Query context to the app.
// The queryClient singleton lives in core/api/queryClient.ts so it can
// also be imported directly in non-component code (e.g. after mutations).

import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/core/api/queryClient";

interface QueryProviderProps {
    children: React.ReactNode;
}

const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default QueryProvider;