// src/modules/users/api/index.ts
// All HTTP calls for the Driver domain.
//
// Endpoint contract (mirrors backend):
//   GET    /drivers                  — paginated list (tenant-scoped)
//   GET    /drivers/:id              — single driver (basic)
//   GET    /drivers/:id/details      — driver + current_trip + stats
//   POST   /drivers                  — create (school_id + branch_id in body)
//   PUT    /drivers/:id              — update
//   DELETE /drivers/:id              — soft-delete (is_active = false)
import { apiClient } from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    DriverResponse,
    DriverWithDetails,
    DriverCreateRequest,
    DriverUpdateRequest,
    DriverFilters,
} from "../types";

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated, tenant-scoped list of drivers.
 *
 * Role filtering behaviour (enforced server-side):
 *   - SUPER_ADMIN  → all drivers across all schools
 *   - SCHOOL_ADMIN → drivers within their school (all branches)
 *   - BRANCH_ADMIN → drivers within their branch only
 *
 * @param filters - Pagination, search, and tenant scope params.
 * @returns Paginated list of Driver records.
 */
export async function getDrivers(
    filters?: DriverFilters,
): Promise<PaginatedResponse<DriverResponse>> {
    const { data } = await apiClient.get<PaginatedResponse<DriverResponse>>(
        "/drivers/",
        { params: filters },
    );
    return data;
}

// ---------------------------------------------------------------------------
// Single — lightweight (list card data only)
// ---------------------------------------------------------------------------

/**
 * Fetch a single driver by ID (basic fields, no relations).
 * Use this when you only need to confirm existence before a mutation.
 *
 * @param driverId - The driver's primary key.
 * @returns Driver record without relational data.
 */
export async function getDriver(driverId: number): Promise<DriverResponse> {
    const { data } = await apiClient.get<DriverResponse>(`/drivers/${driverId}`);
    return data;
}

// ---------------------------------------------------------------------------
// Single — detailed (with current_trip + stats)
// ---------------------------------------------------------------------------

/**
 * Fetch a driver together with their current trip assignment and
 * lifetime statistics. Used by the detail slide-over panel.
 *
 * @param driverId - The driver's primary key.
 * @returns DriverWithDetails enriched with relational data.
 */
export async function getDriverWithDetails(
    driverId: number,
): Promise<DriverWithDetails> {
    const { data } = await apiClient.get<DriverWithDetails>(
        `/drivers/${driverId}/details`,
    );
    return data;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new driver record.
 * The request body MUST include school_id and branch_id for multi-tenancy.
 *
 * @param payload - Driver creation payload including tenant scope.
 * @returns The newly created Driver record.
 */
export async function createDriver(
    payload: DriverCreateRequest,
): Promise<DriverResponse> {
    const { data } = await apiClient.post<DriverResponse>("/drivers", payload);
    return data;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Update mutable fields on an existing driver.
 * school_id and branch_id are intentionally excluded from the payload
 * (immutable after creation — enforced by the backend).
 *
 * @param driverId - The driver's primary key.
 * @param payload  - Partial update payload.
 * @returns The updated Driver record.
 */
export async function updateDriver(
    driverId: number,
    payload: DriverUpdateRequest,
): Promise<DriverResponse> {
    const { data } = await apiClient.patch<DriverResponse>(
        `/drivers/${driverId}`,
        payload,
    );
    return data;
}

// ---------------------------------------------------------------------------
// Deactivate (soft delete)
// ---------------------------------------------------------------------------

/**
 * Soft-delete a driver by setting is_active = false.
 * The record is never hard-deleted — it can be restored via updateDriver.
 *
 * @param driverId - The driver's primary key.
 * @returns The deactivated Driver record (is_active will be false).
 */
export async function deactivateDriver(driverId: number): Promise<DriverResponse> {
    const { data } = await apiClient.delete<DriverResponse>(`/drivers/${driverId}`);
    return data;
}