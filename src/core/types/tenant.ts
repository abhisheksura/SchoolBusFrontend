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