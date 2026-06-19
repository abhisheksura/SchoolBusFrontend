// src/features/assignments/components/AssignmentRow.tsx
//
// A single assignment displayed as a row card.
// Used by both view modes (By Student and By Route) — the `mode` prop
// controls which contextual label is shown on the left of the row.
//
// Layout:
//   [type badge]  [main label]  [secondary label]  [status]  [remove button]
//
// The "main label" and "secondary label" differ by view mode:
//   By Student:  route name  →  stop name
//   By Route:    student name →  stop name
//
// Remove confirmation is handled by the parent — this component only
// fires the onRemove callback.

import React                    from "react";
import { Trash2, MapPin, Route } from "lucide-react";
import { StatusBadge }           from "@/components";
import { formatDate }            from "@/core/utils/formatters";
import type { AssignmentResponse, AssignmentType } from "../types";

// =============================================================================
// Props
// =============================================================================

export interface AssignmentRowProps {
    assignment : AssignmentResponse;

    /** Human-readable student name — resolved by parent from cache. */
    studentName: string;
    /** Human-readable route name — resolved by parent from cache. */
    routeName  : string;
    /** Human-readable stop name — resolved by parent from cache. */
    stopName   : string;

    /** Controls which label is "primary" in the row. */
    viewMode   : "by_student" | "by_route";

    canEdit    : boolean;
    onRemove   : (assignment: AssignmentResponse) => void;
}

// =============================================================================
// Trip type badge styles
// =============================================================================

const TYPE_STYLES: Record<AssignmentType, { badge: string; dot: string }> = {
    PICKUP : {
        badge: "bg-blue-50 border border-blue-100 text-blue-600",
        dot  : "bg-blue-500",
    },
    DROPOFF: {
        badge: "bg-amber-50 border border-amber-100 text-amber-600",
        dot  : "bg-amber-500",
    },
};

const TYPE_LABELS: Record<AssignmentType, string> = {
    PICKUP : "Pick-up",
    DROPOFF: "Drop-off",
};

// =============================================================================
// Component
// =============================================================================

/**
 * AssignmentRow
 *
 * Renders one assignment as a horizontal card-row.
 * Intentionally stateless — all data is resolved by the parent.
 * Remove confirmation lives in the parent page (AssignmentsPage).
 */
export const AssignmentRow: React.FC<AssignmentRowProps> = ({
    assignment,
    studentName,
    routeName,
    stopName,
    viewMode,
    canEdit,
    onRemove,
}) => {
    const tripType = assignment.assignment_type as AssignmentType;
    const styles   = TYPE_STYLES[tripType];

    // Which label goes at the top vs the secondary line
    const primaryLabel   = viewMode === "by_student" ? routeName  : studentName;
    const primaryIcon    = viewMode === "by_student"
        ? <Route size={12} className="shrink-0 text-indigo-400" />
        : null;

    return (
        <div
            className={[
                "flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5 shadow-sm",
                "transition-colors duration-150",
                assignment.is_active
                    ? "border-slate-200 hover:border-slate-300"
                    : "border-slate-100 opacity-60",
            ].join(" ")}
        >
            {/* ── Trip type badge ────────────────────────────────── */}
            <span
                className={[
                    "inline-flex shrink-0 items-center gap-1.5",
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    styles.badge,
                ].join(" ")}
            >
                <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                {TYPE_LABELS[tripType]}
            </span>

            {/* ── Main info ──────────────────────────────────────── */}
            <div className="flex flex-1 flex-col min-w-0 gap-0.5">
                {/* Primary label — route name (by student) or student name (by route) */}
                <div className="flex items-center gap-1.5 min-w-0">
                    {primaryIcon}
                    <p className="truncate text-sm font-semibold text-slate-800">
                        {primaryLabel}
                    </p>
                </div>

                {/* Stop name + assigned date */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate">{stopName}</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-300">·</span>
                    <span className="shrink-0 text-[10px] text-slate-400">
                        {formatDate(assignment.assigned_at)}
                    </span>
                </div>
            </div>

            {/* ── Status ─────────────────────────────────────────── */}
            <StatusBadge active={assignment.is_active} />

            {/* ── Remove button ──────────────────────────────────── */}
            {canEdit && assignment.is_active && (
                <button
                    type="button"
                    onClick={() => onRemove(assignment)}
                    title="Remove assignment"
                    className={[
                        "shrink-0 flex h-7 w-7 items-center justify-center",
                        "rounded-lg text-slate-300 transition-colors",
                        "hover:bg-red-50 hover:text-red-500",
                    ].join(" ")}
                    aria-label={`Remove ${TYPE_LABELS[tripType]} assignment`}
                >
                    <Trash2 size={14} strokeWidth={2} />
                </button>
            )}
        </div>
    );
};

export default AssignmentRow;