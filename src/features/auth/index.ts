// Public API for the auth directory

// 1. App Router Entry Points
export { authRoutes } from './routes';

// 2. State & Hook Core Accessors
export { AuthContextProvider } from './context';
export { useAuthStore } from "./store";
export { useAuth } from './hooks/useAuth';

// Export the stateful hooks for components to consume
export {
    useMeQuery, useLoginMutation, useLogoutMutation, authKeys,
    loginApi, logoutApi, getMeApi, refreshTokenApi
 } from './api';

export { ADMIN_ROLES, ROLE_LABELS } from './types';
export type {
    UserRole,
    LoginRequest,
    LoginPlatform,
    MeResponse,
    RoleResponse,
    TokenResponse,
    AuthState
 } from './types';