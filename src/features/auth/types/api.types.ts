
export type UserRole =
    | "SUPER_ADMIN"
    | "SCHOOL_ADMIN"
    | "BRANCH_ADMIN"
    | "DRIVER"
    | "PARENT"
    | "STUDENT";

export type LoginPlatform = "web" | "mobile";

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
    school_name?: string | null;
    branch_id: number | null;
    branch_name?: string | null;
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
