import { apiClient }             from "@/core";
import type {
    TripLiveStatusResponse
} from "../types";
// ---------------------------------------------------------------------------
// Live Status
// ---------------------------------------------------------------------------

/**
 * Get the current GPS position for an IN_PROGRESS trip.
 * Returns 404 if the trip has not started yet.
 */
export const getTripLiveStatus = async (
    tripId  : number,
    schoolId: number,
    branchId: number,
): Promise<TripLiveStatusResponse> => {
    const { data } = await apiClient.get<TripLiveStatusResponse>(
        `/trips/trips/${tripId}/live-status`,
        { params: { school_id: schoolId, branch_id: branchId } },
    );
    return data;
};