// core/types/tenant.ts
// Shared school + branch context embedded in any domain response scoped to a branch.
// Mirrors TenantResponse in app/core/schemas.py.
//
// Usage:
//   import type { TenantInfo } from "@/core/types/tenant";
//
//   export interface BusResponse extends TenantInfo {
//       bus_id    : number;
//       bus_number: string;
//       ...
//   }

export interface TenantInfo {
    school_id  : number;
    school_name: string;
    branch_id  : number;
    branch_name: string;
}

// ==================== Pagination ====================


// ==================== Schools ====================
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

// ==================== Branches ====================
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

// ==================== Common Types ====================
export type SortDirection = 'asc' | 'desc';

export interface SortParams {
    sort_by?: string;
    sort_direction?: SortDirection;
}