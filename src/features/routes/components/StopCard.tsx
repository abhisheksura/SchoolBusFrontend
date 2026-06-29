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
import type { StopResponse } from "../types";

// =============================================================================
// Props
// =============================================================================

export interface StopCardProps {
    stop    : StopResponse;
    /** Show school + branch meta rows — true for SUPER_ADMIN and SCHOOL_ADMIN. */
    showSchool : boolean;
    canEdit    : boolean;
    onEdit     : (stop: StopResponse) => void;
    onToggle   : (stop: StopResponse) => void;
}


// =============================================================================
// Component
// =============================================================================

/**
 * StudentCard
 *
 * Displays a student's key info in a scannable card layout.
 * Clicking the card navigates to /students/:id with school + branch
 * in router state so the detail page never needs to re-derive tenant context.
 */
export const StopCard: React.FC<StopCardProps> = ({
    stop,
    showSchool,
    canEdit,
    onEdit,
    onToggle,
}) => {
    const navigate = useNavigate();
    const stopName   = stop.stop_name
    const initials = [stop.stop_name[0], stop.stop_name?.[1] ?? ""]
        .join("")
        .toUpperCase();
    /** Navigate to the student detail page, forwarding tenant context. */
    const goToDetail = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        navigate(`/stops/${stop.stop_id}`, {
            state: {
                breadcrumbLabel: stopName,
                schoolId       : stop.school_id,
                branchId       : stop.branch_id,
            },
        });
    };

    return (
        <BaseCard clickable onClick={goToDetail}>

            {/* ── Header: avatar + name + status ──────────────────────── */}
            <div className="flex items-start justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with initials */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-500 text-sm font-bold text-black shadow-sm shadow-emerald-500/20">
                        {initials}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                            {stopName}
                        </p>
                    </div>
                </div>

                <StatusBadge active={stop.is_active} />
            </div>


            {/* ── Meta rows ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 px-5 pb-4">
                {showSchool && (
                    <>
                        <CardMetaRow icon={<Building2 size={11} />}>
                            {/* school_name not on StudentResponse — show school_id */}
                            School: <span>{stop.school_name}</span>
                        </CardMetaRow>
                        <CardMetaRow icon={<MapPin size={11} />}>
                            Branch: <span>{stop.branch_name}</span>
                        </CardMetaRow>
                    </>
                )}

                <CardMetaRow icon={<Calendar size={11} />}>
                    Added {formatDate(stop.created_at)}
                </CardMetaRow>
            </div>

            {/* ── Footer actions ────────────────────────────────────────── */}
            {canEdit && (
                <CardFooter>
                    <CardEditButton onClick={() => onEdit(stop)} />
                    <div className="h-6 w-px bg-slate-100" />
                    <ToggleActiveButton
                        isActive={stop.is_active}
                        onClick={() => onToggle(stop)}
                    />
                </CardFooter>
            )}
        </BaseCard>
    );
};

export default StopCard;