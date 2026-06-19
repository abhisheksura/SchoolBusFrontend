// /src/features/assignments/api/route-assignments.api.ts
// ---------------------------------------------------------------------------
// Read — by route
// ---------------------------------------------------------------------------
console.log("route-assignments.api loaded");

export const TEST_EXPORT = "test";

import { apiClient }             from "@/core";
import type { PaginatedResponse } from "@/core/types/pagination";
import type {
    AssignmentResponse,
    RouteAssignmentFilters,
} from "../types";
/**
 * Fetch paginated assignments for a specific route.
 * Optionally filter by assignment_type (PICKUP | DROPOFF).
 *
 * @param routeId — Route's primary key.
 * @param filters — Must include school_id + branch_id.
 */
export const getRouteAssignments = async (
    routeId: number,
    filters: RouteAssignmentFilters,
): Promise<PaginatedResponse<AssignmentResponse>> => {
    const { data } = await apiClient.get<PaginatedResponse<AssignmentResponse>>(
        `/assignments/route/${routeId}`,
        { params: filters },
    );
    return data;
};