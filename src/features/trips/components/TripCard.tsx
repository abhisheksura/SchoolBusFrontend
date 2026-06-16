// src/features/trips/components/TripCard.tsx
//
// Card representation of a single Trip.
// Follows the exact same structure as RouteCard:
//   • BaseCard wrapper
//   • Header — trip_type icon + status badge
//   • Highlight band — route + date
//   • Meta rows — bus, driver
//   • Status action buttons (computed from TRIP_STATUS_TRANSITIONS)
//   • View Live Map CTA (only when IN_PROGRESS)
//   • CardFooter — Assign Assets (SCHEDULED only)

import React             from "react";
import { useNavigate }   from "react-router-dom";
import {
    Navigation,
    ArrowRight,
    Bus,
    UserCog,
    Calendar,
    MapPin,
    Building2,
    Play,
    CheckCircle2,
    XCircle,
}                        from "lucide-react";

import {
    StatusBadge,
    BaseCard,
    CardFooter,
    CardEditButton,
}                        from "@/components";
import { formatDate }    from "@/core/utils/formatters";
import {
    TRIP_STATUS_LABELS,
    TRIP_STATUS_COLORS,
    TRIP_TYPE_LABELS
}                        from "../constants";
import type { TripStatus } from "../constants";
import type { TripResponse } from "../types";
import { TRIP_STATUS_TRANSITIONS } from "../types";

// =============================================================================
// Props
// =============================================================================

export interface TripCardProps {
    trip      : TripResponse;
    /** Human-readable route name resolved by the parent page. */
    routeName  : string;
    /** Bus number resolved by the parent page (null if not assigned). */
    busNumber  : string | null;
    /** Driver full name resolved by the parent page (null if not assigned). */
    driverName : string | null;
    showSchool : boolean;
    canEdit    : boolean;
    onAssign   : (trip: TripResponse) => void;
    onTransition: (trip: TripResponse, status: TripStatus) => void;
}

// =============================================================================
// Status action config — maps each allowed next-status to a button style
// =============================================================================

const TRANSITION_BUTTONS: Record<TripStatus, { label: string; icon: React.ReactNode; className: string }> = {
    IN_PROGRESS: {
        label    : "Start",
        icon     : <Play size={12} strokeWidth={2.5} />,
        className: "bg-green-500 text-white hover:bg-green-600",
    },
    COMPLETED: {
        label    : "Complete",
        icon     : <CheckCircle2 size={12} strokeWidth={2.5} />,
        className: "bg-blue-500 text-white hover:bg-blue-600",
    },
    CANCELLED: {
        label    : "Cancel",
        icon     : <XCircle size={12} strokeWidth={2.5} />,
        className: "border border-red-200 text-red-500 hover:bg-red-50",
    },
    // Terminal states — never rendered as buttons
    SCHEDULED: { label: "", icon: null, className: "" },
};

// =============================================================================
// Component
// =============================================================================

export const TripCard: React.FC<TripCardProps> = ({
    trip,
    routeName,
    busNumber,
    driverName,
    showSchool,
    canEdit,
    onAssign,
    onTransition,
}) => {
    const navigate       = useNavigate();
    const allowedNextStatuses = TRIP_STATUS_TRANSITIONS[trip.trip_status];
    const isInProgress       = trip.trip_status === "IN_PROGRESS";
    const isScheduled        = trip.trip_status === "SCHEDULED";

    const goToLiveMap = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        navigate(`/trips/${trip.trip_id}/live`, {
            state: {
                breadcrumbLabel: `Trip #${trip.trip_id}`,
                schoolId       : trip.school_id,
                branchId       : trip.branch_id,
            },
        });
    };

    return (
        <BaseCard>

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-start justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Navigation size={20} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        {/* Trip type badge */}
                        <span className={[
                            "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold mb-1",
                            trip.trip_type === "PICKUP"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-amber-50 text-amber-600",
                        ].join(" ")}>
                            {TRIP_TYPE_LABELS[trip.trip_type]}
                        </span>
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                            Trip #{trip.trip_id}
                        </p>
                    </div>
                </div>
                {/* Status badge */}
                <span className={[
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shrink-0",
                    TRIP_STATUS_COLORS[trip.trip_status] ?? "bg-slate-100 text-slate-500",
                ].join(" ")}>
                    {TRIP_STATUS_LABELS[trip.trip_status] ?? trip.trip_status}
                </span>
            </div>

            {/* ── Route + date highlight ───────────────────────────────── */}
            <div className="mx-5 mb-3">
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5">
                    <p className="truncate text-xs font-semibold text-blue-700">
                        {routeName}
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">
                        {formatDate(trip.service_date)}
                    </p>
                </div>
            </div>

            {/* ── Meta rows ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 px-5 pb-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Bus size={11} className="shrink-0 text-slate-400" />
                    <span className="truncate">
                        {busNumber ?? (
                            <span className="text-amber-500 font-medium">No bus assigned</span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <UserCog size={11} className="shrink-0 text-slate-400" />
                    <span className="truncate">
                        {driverName ?? (
                            <span className="text-amber-500 font-medium">No driver assigned</span>
                        )}
                    </span>
                </div>
                {showSchool && (
                    <>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Building2 size={11} className="shrink-0" />
                            <span className="truncate">School #{trip.school_id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">Branch #{trip.branch_id}</span>
                        </div>
                    </>
                )}
            </div>

            {/* ── Live Map CTA (IN_PROGRESS only) ─────────────────────── */}
            {isInProgress && (
                <div className="mx-5 mb-3">
                    <button
                        type="button"
                        onClick={goToLiveMap}
                        className="flex w-full items-center justify-between rounded-xl bg-green-50 border border-green-100 px-4 py-2.5 text-xs font-semibold text-green-600 hover:bg-green-100 hover:border-green-200 transition-colors"
                    >
                        <span>View Live Map</span>
                        <ArrowRight size={13} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {/* ── Status transition buttons ────────────────────────────── */}
            {canEdit && allowedNextStatuses.length > 0 && (
                <div className="flex gap-2 px-5 pb-4">
                    {allowedNextStatuses.map((nextStatus) => {
                        const cfg = TRANSITION_BUTTONS[nextStatus];
                        return (
                            <button
                                key={nextStatus}
                                type="button"
                                onClick={() => onTransition(trip, nextStatus)}
                                className={[
                                    "flex flex-1 items-center justify-center gap-1.5",
                                    "rounded-xl px-3 py-2 text-xs font-semibold",
                                    "transition-colors",
                                    cfg.className,
                                ].join(" ")}
                            >
                                {cfg.icon}
                                {cfg.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Footer: Assign Assets (SCHEDULED only) ──────────────── */}
            {canEdit && isScheduled && (
                <CardFooter>
                    <button
                        type="button"
                        onClick={() => onAssign(trip)}
                        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                    >
                        <Bus size={13} />
                        Assign Bus / Driver
                    </button>
                </CardFooter>
            )}
        </BaseCard>
    );
};

export default TripCard;