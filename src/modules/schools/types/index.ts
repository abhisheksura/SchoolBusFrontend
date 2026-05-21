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
}

export interface SchoolUpdateRequest {
    school_name?: string;
    is_active?: boolean;
}

// ==================== Branch Types ====================
export interface BranchResponse {
    branch_id: number;
    school_id: number;
    branch_name: string;
    branch_address: string | null;
    branch_phone: string | null;
    branch_email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BranchCreateRequest {
    school_id: number;
    branch_name: string;
    branch_address?: string | null;
    branch_phone?: string | null;
    branch_email?: string | null;
}

export interface BranchUpdateRequest {
    branch_name?: string;
    branch_address?: string | null;
    branch_phone?: string | null;
    branch_email?: string | null;
    is_active?: boolean;
}

// ==================== School with Branches ====================
export interface SchoolWithBranches extends SchoolResponse {
    branches?: BranchResponse[];
    branch_count?: number;
}

// ==================== Filters ====================
 
export interface SchoolFilters {
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
}

export interface BranchFilters {
    search?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
}