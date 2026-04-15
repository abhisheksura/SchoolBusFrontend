// ─── Auth Feature — Public API ───────────────────────────────────────────────
// Re-export everything external consumers need.
// Import from "@/features/auth" rather than deep paths.

// ── Page ─────────────────────────────────────────────────────────────────────
export { default as LoginPage } from "./pages/LoginPage";
export { default } from "./pages/LoginPage";

// ── Store ────────────────────────────────────────────────────────────────────
export { useAuthStore } from "./store";

// ── API functions ─────────────────────────────────────────────────────────────
export { loginApi, getMeApi, refreshTokenApi, logoutApi } from "./api";

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
    UserRole,
    LoginRequest,
    TokenResponse,
    TokenPayload,
    MeResponse,
    RoleResponse,
    AuthState,
} from "./types";

export {
    ADMIN_ROLES,
    ROLE_LABELS,
    ROLE_DESCRIPTIONS,
} from "./types";