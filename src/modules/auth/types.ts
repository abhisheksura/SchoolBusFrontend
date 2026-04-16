// modules/auth/types.ts

export type UserRole =
    | "SUPER_ADMIN"
    | "SCHOOL_ADMIN"
    | "BRANCH_ADMIN"
    | "DRIVER"
    | "PARENT"
    | "STUDENT";

export type LoginPlatform = "web" | "mobile";

export const ADMIN_ROLES: UserRole[] = [
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
    "BRANCH_ADMIN",
];

export const ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN:  "Super Admin",
    SCHOOL_ADMIN: "School Admin",
    BRANCH_ADMIN: "Branch Admin",
    DRIVER:       "Driver",
    PARENT:       "Parent",
    STUDENT:      "Student",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    SUPER_ADMIN:  "Full platform access across all schools",
    SCHOOL_ADMIN: "Manage branches, fleet & staff",
    BRANCH_ADMIN: "Day-to-day routes, trips & students",
    DRIVER:       "View assigned trips & routes",
    PARENT:       "Track your child's bus in real time",
    STUDENT:      "View your own trip status",
};

// ---------------------------------------------------------------------------
// API shapes
// ---------------------------------------------------------------------------

export interface LoginRequest {
    user_name: string;
    password: string;
    platform: LoginPlatform;
    role: UserRole;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: "bearer";
}

export interface TokenPayload {
    sub: string;
    exp: number;
    roles: UserRole[];
    school_ids: number[];
    branch_ids: number[];
}

export interface RoleResponse {
    role_id: number;
    role_name: UserRole;
    school_id: number | null;
    branch_id: number | null;
    is_active: boolean;
    assigned_at: string;
}

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

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface AuthState {
    user: MeResponse | null;
    accessToken: string | null;
    activeRole: UserRole | null;
    setAuth: (token: string, user: MeResponse, role: UserRole) => void;
    clearAuth: () => void;
    hasRole: (role: UserRole) => boolean;
    getSchoolIds: () => number[];
    getBranchIds: (schoolId: number) => number[];
}