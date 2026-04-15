    // ─── Auth Types ──────────────────────────────────────────────────────────────
    // Mirrors the FastAPI backend auth schemas exactly.
    // All role/token shapes are defined here and re-exported via index.ts.

    // ---------------------------------------------------------------------------
    // Role Enum
    // ---------------------------------------------------------------------------

    /**
     * All possible roles a user can hold.
     * The login form only surfaces the admin-facing roles.
     */
    export type UserRole =
        | "SUPER_ADMIN"
        | "SCHOOL_ADMIN"
        | "BRANCH_ADMIN"
        | "DRIVER"
        | "PARENT"
        | "STUDENT";

    /** Roles selectable on the admin login screen */
    export const ADMIN_ROLES: UserRole[] = [
        "SUPER_ADMIN",
        "SCHOOL_ADMIN",
        "BRANCH_ADMIN",
    ];

    /** Human-readable labels for each role */
    export const ROLE_LABELS: Record<UserRole, string> = {
        SUPER_ADMIN: "Super Admin",
        SCHOOL_ADMIN: "School Admin",
        BRANCH_ADMIN: "Branch Admin",
        DRIVER: "Driver",
        PARENT: "Parent",
        STUDENT: "Student",
    };

    /** Short description shown beneath the role label on the selector */
    export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
        SUPER_ADMIN: "Full platform access across all schools",
        SCHOOL_ADMIN: "Manage branches, fleet & staff",
        BRANCH_ADMIN: "Day-to-day routes, trips & students",
        DRIVER: "View assigned trips & routes",
        PARENT: "Track your child's bus in real time",
        STUDENT: "View your own trip status",
    };

    // ---------------------------------------------------------------------------
    // Request / Response shapes
    // ---------------------------------------------------------------------------

    /** Body sent to POST /api/v1/auth/login */
    export interface LoginRequest {
        user_name: string;
        password: string;
        role: UserRole;
        platform: "web" | "mobile";
    }

    /** Successful response from POST /api/v1/auth/login */
    export interface TokenResponse {
        access_token: string;
        refresh_token: string;
        token_type: "bearer";
    }

    /**
     * Decoded JWT payload (subset we care about).
     * The backend encodes `sub` as the user_name string.
     */
    export interface TokenPayload {
        sub: string;         // user_name
        exp: number;         // Unix timestamp
        roles: UserRole[];
        school_ids: number[];
        branch_ids: number[];
    }

    /** Mirrors GET /api/v1/auth/me response */
    export interface MeResponse {
        user_id: number;
        user_name: string;
        email: string | null;
        phone: string | null;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        roles: RoleResponse[];
    }

    /** Single role entry inside MeResponse */
    export interface RoleResponse {
        role_id: number;
        role_name: UserRole;
        school_id: number | null;
        branch_id: number | null;
        is_active: boolean;
        assigned_at: string;
    }

    // ---------------------------------------------------------------------------
    // Zustand Store Shape
    // ---------------------------------------------------------------------------

    export interface AuthState {
        /** Decoded user profile (from GET /me, loaded after login) */
        user: MeResponse | null;

        /** Short-lived JWT — kept in memory only, never localStorage */
        accessToken: string | null;

        /** Role that was selected at login time */
        activeRole: UserRole | null;

        // ── Actions ──────────────────────────────────────────────────────────────

        /** Populate store after a successful login + /me fetch */
        setAuth: (token: string, user: MeResponse, role: UserRole) => void;

        /** Wipe everything — called on logout or refresh failure */
        clearAuth: () => void;

        /** True if the user holds the given role */
        hasRole: (role: UserRole) => boolean;

        /**
         * Returns all school_ids the user is scoped to.
         * SUPER_ADMIN returns [] — the API interprets that as "all schools".
         */
        getSchoolIds: () => number[];

        /**
         * Returns branch_ids for a given school.
         * Empty array → SUPER_ADMIN or SCHOOL_ADMIN (unrestricted at branch level).
         */
        getBranchIds: (schoolId: number) => number[];
    }