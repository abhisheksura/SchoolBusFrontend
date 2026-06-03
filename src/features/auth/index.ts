// Public API for the types directory

// 1. App Router Entry Points
export { authRoutes } from './routes';

// 2. State & Hook Core Accessors
export { useAuth } from './hooks/useAuth';

// Export the stateful hooks for components to consume
export {
    useMeQuery, useLoginMutation, useLogoutMutation, authKeys,
    loginApi, logoutApi, getMeApi, refreshTokenApi
 } from './api';

export { useAuthStore } from "./store";
export { ADMIN_ROLES, ROLE_LABELS } from './types';
export type { UserRole, LoginRequest, LoginPlatform, MeResponse, RoleResponse, TokenResponse } from './types';
export type { AuthState } from './types';
export { AuthContextProvider } from './context';