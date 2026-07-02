// src/features/students/components/StudentCard.tsx
//
// Card representation of a single student.
// Follows the same structure as RouteCard and DriverCard:
//   • BaseCard wrapper with hover lift effect
//   • CardHeader — avatar initials + name + status badge
//   • Highlight band — grade / section context
//   • Meta rows — school, branch, admission number, created date
//   • CardFooter — Edit + Toggle active (canEdit guard)
//   • Clicking anywhere navigates to the student detail page

import React            from "react";
import { useNavigate }  from "react-router-dom";
import {
    GraduationCap,
    Building2,
    MapPin,
    Hash,
    Calendar,
    ArrowRight,
    User,
    Users
}                       from "lucide-react";

import {
    StatusBadge,
    CardEditButton,
    ToggleActiveButton,
    BaseCard,
    CardFooter,
    CardMetaRow,
}                       from "@/components";
import { formatDate }   from "@/core/utils/formatters";
import type { BusResponse } from "../types";

// =============================================================================
// Props
// =============================================================================

export interface BusCardProps {
    bus        : BusResponse;
    /** Show school + branch meta rows — true for SUPER_ADMIN and SCHOOL_ADMIN. */
    showSchool : boolean;
    canEdit    : boolean;
    onEdit     : (student: BusResponse) => void;
    onToggle   : (student: BusResponse) => void;
}

// =============================================================================
// Helpers
// =============================================================================

/** Derive two uppercase initials from first + last name. */
function getInitials(firstName: string, lastName: string | null): string {
    const parts = [firstName, lastName].filter(Boolean) as string[];
    return parts.map((p) => p[0].toUpperCase()).join("");
}

// =============================================================================
// Component
// =============================================================================

/**
 * BusCard
 *
 * Displays a student's key info in a scannable card layout.
 * Clicking the card navigates to /students/:id with school + branch
 * in router state so the detail page never needs to re-derive tenant context.
 */
export const BusCard: React.FC<BusCardProps> = ({
    bus,
    showSchool,
    canEdit,
    onEdit,
    onToggle,
}) => {

    const initials   = getInitials(bus.bus_number[0], bus.bus_number[1]);
    const busNumber  = bus.bus_number
    //const gradeLabel = buildGradeLabel(student.grade, student.section);

    const sizeLabel = bus.capacity >= 50 ? "Large Bus"
        : bus.capacity >= 30 ? "Medium Bus"
        : "Small Bus";

    return (
        <BaseCard>

            {/* ── Header: avatar + name + status ──────────────────────── */}
            <div className="flex items-start justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with initials */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-500 text-sm font-bold text-black shadow-sm shadow-emerald-500/20">
                        {initials}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                            {busNumber}
                        </p>
                    </div>
                </div>

                <StatusBadge active={bus.is_active} />
            </div>

            {/* ── Grade / section highlight band ───────────────────────── */}
            <div className="mx-5 mb-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5">
                    <User
                        size={14}
                        className="text-yellow-500 shrink-0"
                    />
                    <div>
                        <p className="text-xs font-semibold text-yellow-700 truncate">{sizeLabel}</p>
                        <p className="text-sm font-bold text-yellow-800">
                            {bus.capacity} {" "}
                            <span className="font-normal text-yellow-600 text-xs">seats</span>
                        </p>
                    </div>
                </div>
            </div>
            {/* ── Meta rows ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 px-5 pb-4">
                {showSchool && (
                    <>
                        <CardMetaRow icon={<Building2 size={11} />}>
                            {/* school_name not on BusResponse — show school_id */}
                            School: <span>{bus.school_name}</span>
                        </CardMetaRow>
                        <CardMetaRow icon={<MapPin size={11} />}>
                            Branch: <span>{bus.branch_name}</span>
                        </CardMetaRow>
                    </>
                )}

                <CardMetaRow icon={<Calendar size={11} />}>
                    Added {formatDate(bus.created_at)}
                </CardMetaRow>
            </div>

            {/* ── Footer actions ────────────────────────────────────────── */}
            {canEdit && (
                <CardFooter>
                    <CardEditButton onClick={() => onEdit(bus)} />
                    <div className="h-6 w-px bg-slate-100" />
                    <ToggleActiveButton
                        isActive={bus.is_active}
                        onClick={() => onToggle(bus)}
                    />
                </CardFooter>
            )}
        </BaseCard>
    );
};

export default BusCard;