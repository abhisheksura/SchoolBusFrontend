// src/features/auth/api/index.ts

// Export the stateful hooks for components to consume
export { useMeQuery, useLoginMutation, useLogoutMutation, authKeys } from './auth-queries';

// If an interceptor in your core module needs access to the raw refresh token endpoint,
// you can selectively export just that request:
export { loginApi, logoutApi, getMeApi, refreshTokenApi } from './auth-requests';