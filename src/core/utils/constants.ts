// core/utils/constants.ts
// Display labels and Tailwind color classes for backend enum values.

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

// ---------------------------------------------------------------------------
// Attendance status
// ---------------------------------------------------------------------------

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
    BOARDED: "Boarded",
    DROPPED: "Dropped",
    NO_SHOW: "No Show",
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
    BOARDED: "bg-green-100 text-green-700",
    DROPPED: "bg-blue-100 text-blue-700",
    NO_SHOW: "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Leave status
// ---------------------------------------------------------------------------

export const LEAVE_STATUS_LABELS: Record<string, string> = {
    PENDING:  "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
};

export const LEAVE_STATUS_COLORS: Record<string, string> = {
    PENDING:  "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Notification status
// ---------------------------------------------------------------------------

export const NOTIF_STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-600",
    SENT:    "bg-green-100 text-green-700",
    FAILED:  "bg-red-100 text-red-700",
    READ:    "bg-blue-100 text-blue-700",
};