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
import {
    Pencil,
    Trash2,
    MapPin,
    Route,
    Phone,
    ArrowUpCircle,
    ArrowDownCircle,
    Bus,
    Calendar,
    User,
    Power
} from "lucide-react";
import { StatusBadge }           from "@/components";
import { formatDate }            from "@/core/utils/formatters";
import type { AssignmentResponse, AssignmentType } from "../types";

// =============================================================================
// Props
// =============================================================================

export interface AssignmentRowProps {
    assignment : AssignmentResponse;

    /** Human-readable route name — resolved by parent from cache. */
    routeName  : string;
    /** Human-readable stop name — resolved by parent from cache. */
    stopName   : string;

    /** Controls which label is "primary" in the row. */
    viewMode   : "by_student" | "by_route";

    canEdit    : boolean;
    onEdit     : (assignment: AssignmentResponse) => void;
    onRemove   : (assignment: AssignmentResponse) => void;
    onActivate: (assignment: AssignmentResponse) => void;
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
    routeName,
    stopName,
    canEdit,
    onEdit,
    onRemove,
    onActivate
}) => {
    const tripType = assignment.assignment_type as AssignmentType;
    const styles = TYPE_STYLES[tripType];

    const isPickup = tripType === "PICKUP";

    // Replace these with actual values from your API
    const studentName   = [assignment.student.first_name, assignment.student.last_name]
        .filter(Boolean)
        .join(" ");    const grade = assignment.student?.grade ?? "Grade 5";
    const section = assignment.student?.section ?? "A";
    const phone = assignment.student?.parent_phone ?? "98XXXX1234";
    const admissionNumber = assignment.student.admission_number

    return (
        <div
            className={[
                "grid items-center gap-5",
                "grid-cols-[minmax(280px,2fr)_160px_minmax(220px,1.5fr)_120px_90px_48px]",
                "rounded-xl border border-slate-200 bg-white",
                "px-4 py-3",
                "transition-all duration-200",
                assignment.is_active
                    ? "hover:border-indigo-200 hover:bg-slate-50"
                    : "opacity-60",
            ].join(" ")}
        >
            {/* Student */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {studentName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                        {studentName}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                        {admissionNumber} - {grade}-{section}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
                <Phone
                    size={14}
                    className="shrink-0 text-slate-400"
                />
                <span className="truncate text-sm text-slate-700">
                    {phone}
                </span>
            </div>

            {/* Stop */}
            <div className="flex items-center gap-2 min-w-0">
                <MapPin
                    size={16}
                    className="shrink-0 text-emerald-500"
                />

                <span className="truncate text-sm text-slate-700">
                    {stopName}
                </span>
            </div>

            {/* Trip */}
            <div>
                <span
                    className={[
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        styles.badge,
                    ].join(" ")}
                >
                    {isPickup ? (
                        <ArrowUpCircle size={14} />
                    ) : (
                        <ArrowDownCircle size={14} />
                    )}

                    {TYPE_LABELS[tripType]}
                </span>
            </div>

            {/* Status */}
            <StatusBadge active={assignment.is_active} />

            {/* Actions */}
            <div className="flex justify-end">
                {canEdit && assignment.is_active && (
                    <>
                        <button
                            type="button"
                            onClick={() => onEdit(assignment)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            aria-label="Edit assignment"
                            title="Edit assignment"
                        >
                            <Pencil size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() => onRemove(assignment)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="Deactivate assignment"
                            title="Deactivate assignment"
                        >
                            <Power size={16} />
                        </button>
                    </>
                )}
                {canEdit && !assignment.is_active && (
                    <button
                        type="button"
                        onClick={() => onActivate(assignment)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                        aria-label="Activate assignment"
                        title="Activate assignment"
                    >
                        <Power size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
export default AssignmentRow;