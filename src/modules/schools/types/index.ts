// src/modules/schools/types/index.ts

// ==================== School Types ====================
export interface SchoolResponse {
    school_id: number;
    school_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface SchoolCreateRequest {
    school_name: string;
    // school_id, is_active, created_at, updated_at are set by the backend
    // Schools are NOT branch-scoped — no branch_id here
    // school_id is the tenant root itself
}

export interface SchoolUpdateRequest {
    school_name?: string;
    // school_id NOT included — immutable
    // is_active NOT included here — use toggle endpoint (PATCH soft-delete)
}

export interface SchoolFilters {
    active_only?: boolean;   // matches backend query param name exactly
    page?:        number;
    page_size?:   number;
    // NOTE: backend does not support a search param — filter client-side
}

// ==================== Branch Types ====================
export interface BranchResponse {
    branch_id: number;
    school_id: number;          // Tenant root — always required
    branch_name: string;
    branch_address: string | null;
    branch_phone: string | null;
    branch_email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BranchCreateRequest {
    school_id: number;          // Required for multi-tenancy
    branch_name: string;
    branch_address?: string | null;
    branch_phone?: string | null;
    branch_email?: string | null;
    // branch_id, is_active, created_at, updated_at are set by the backend
}

export interface BranchUpdateRequest {
    branch_name?: string;
    branch_address?: string | null;
    branch_phone?: string | null;
    branch_email?: string | null;
    // school_id NOT included — immutable
    // branch_id NOT included — immutable
    is_active?: boolean;
}

// ==================== School with Branches ====================
export interface SchoolWithBranches extends SchoolResponse {
    branches?: BranchResponse[];
    branch_count?: number;
}


export interface BranchFilters {
    school_id?:   number;
    active_only?: boolean;   // matches backend query param name exactly
    page?:        number;
    page_size?:   number;
    // NOTE: backend does not support a search param — filter client-side
}