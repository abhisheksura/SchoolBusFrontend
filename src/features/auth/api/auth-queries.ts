// src/features/auth/api/auth-queries.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as authRequests from "./auth-requests";
import type { LoginRequest } from "../types";

// Query key constants for architectural cleanliness
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

// Hook for fetching current user profile
export function useMeQuery(token?: string, enabled = true) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authRequests.getMeApi(token),
    enabled: enabled,
    retry: false, // Don't spam /me endpoint if unauthorized
  });
}

// Hook for logging in
export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => authRequests.loginApi(payload),
  });
}

// Hook for logging out
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authRequests.logoutApi,
    onSuccess: () => {
      // Clear all cached queries upon logout for security
      queryClient.clear();
    },
  });
}