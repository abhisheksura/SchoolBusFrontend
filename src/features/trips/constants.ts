// /src/features/trips/constants.ts
// ---------------------------------------------------------------------------
// Trip status
// ---------------------------------------------------------------------------

export const TRIP_STATUS_LABELS: Record<string, string> = {
    SCHEDULED:   "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED:   "Completed",
    CANCELLED:   "Cancelled",
};

export const TRIP_STATUS_COLORS: Record<string, string> = {
    SCHEDULED:   "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-green-100 text-green-700",
    COMPLETED:   "bg-slate-100 text-slate-600",
    CANCELLED:   "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Trip type
// ---------------------------------------------------------------------------

export const TRIP_TYPE_LABELS: Record<string, string> = {
    PICKUP:  "Pick-up",
    DROPOFF: "Drop-off",
};