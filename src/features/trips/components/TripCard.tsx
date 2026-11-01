// src/features/trips/components/TripCard.tsx
//
// Card representation of a single Trip.
//
// Layout (grid variant):
//   ┌──────────────────────────────────────┐
//   │ [14 MAR]  Trip #15        ● STATUS   │   header: date block + id + badge
//   │           14 Mar 2026                │
//   │ [☀ R1 - LB Nagar]         [PICKUP]   │   route band (colour = trip type)
//   │ [🚌 BUS     ] [👤 DRIVER   ]         │   bus + driver tiles
//   │ ───────────────────────────────────  │
//   │ Edit      Start         Cancel       │   footer actions
//   └──────────────────────────────────────┘
//
// The list variant renders the same pieces on a single horizontal row.
// Allowed actions come from TRIP_STATUS_TRANSITIONS (mirrors the backend).

import React from "react";
import { format, parseISO } from "date-fns";
import {
    Bus,
    User,
    Pencil,
    Play,
    CheckCircle2,
    XCircle,
    Sunrise,
    Sunset,
} from "lucide-react";

import { BaseCard } from "@/components";
import { TRIP_STATUS_LABELS } from "../constants";
import type { TripStatus } from "../constants";
import type { TripResponse } from "../types";
import { TRIP_STATUS_TRANSITIONS } from "../types";

// =============================================================================
// Props
// =============================================================================

export interface TripCardProps {
    trip        : TripResponse;
    /** Human-readable route name resolved by the parent page. */
    routeName   : string;
    /** Bus number resolved by the parent page (null if not assigned). */
    busNumber   : string | null;
    /** Driver full name resolved by the parent page (null if not assigned). */
    driverName  : string | null;
    canEdit     : boolean;
    /** "grid" = vertical card (default), "list" = compact horizontal row. */
    variant    ?: "grid" | "list";
    onAssign    : (trip: TripResponse) => void;
    onTransition: (trip: TripResponse, status: TripStatus) => void;
}

// =============================================================================
// Style maps
// =============================================================================

interface StatusStyle {
    badge: string;   // pill next to the title
    dot  : string;   // coloured dot inside the pill
    block: string;   // date block
}

const STATUS_STYLE: Record<string, StatusStyle> = {
    SCHEDULED: {
        badge: "border-blue-200 bg-blue-50 text-blue-600",
        dot  : "bg-blue-500",
        block: "border-blue-100 bg-blue-50 text-blue-600",
    },
    IN_PROGRESS: {
        badge: "border-amber-200 bg-amber-50 text-amber-600",
        dot  : "bg-amber-500",
        block: "border-amber-100 bg-amber-50 text-amber-600",
    },
    COMPLETED: {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-600",
        dot  : "bg-emerald-500",
        block: "border-emerald-100 bg-emerald-50 text-emerald-600",
    },
    CANCELLED: {
        badge: "border-slate-200 bg-slate-50 text-slate-400",
        dot  : "bg-slate-300",
        block: "border-slate-100 bg-slate-50 text-slate-400",
    },
};

const FALLBACK_STATUS_STYLE: StatusStyle = STATUS_STYLE.CANCELLED;

const TYPE_STYLE = {
    PICKUP: {
        label: "Pickup",
        band : "border-emerald-100 bg-emerald-50/70",
        badge: "border-emerald-200 text-emerald-600",
        icon : <Sunrise size={14} className="shrink-0 text-emerald-500" />,
    },
    DROPOFF: {
        label: "Drop",
        band : "border-orange-100 bg-orange-50/70",
        badge: "border-orange-200 text-orange-500",
        icon : <Sunset size={14} className="shrink-0 text-orange-500" />,
    },
} as const;

const TRANSITION_BUTTONS: Record<
    string,
    { label: string; icon: React.ReactNode; className: string }
> = {
    IN_PROGRESS: {
        label    : "Start",
        icon     : <Play size={12} strokeWidth={2.5} />,
        className: "border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
    },
    COMPLETED: {
        label    : "Complete",
        icon     : <CheckCircle2 size={12} strokeWidth={2.5} />,
        className: "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
    CANCELLED: {
        label    : "Cancel",
        icon     : <XCircle size={12} strokeWidth={2.5} />,
        className: "text-slate-400 hover:bg-red-50 hover:text-red-500",
    },
};

// =============================================================================
// Small presentational pieces
// =============================================================================

const DateBlock: React.FC<{ date: string; status: string }> = ({ date, status }) => {
    const d     = parseISO(date);
    const style = STATUS_STYLE[status] ?? FALLBACK_STATUS_STYLE;
    return (
        <div
            className={[
                "flex h-12 w-12 shrink-0 flex-col items-center justify-center",
                "rounded-xl border leading-none",
                style.block,
            ].join(" ")}
        >
            <span className="text-lg font-bold">{format(d, "d")}</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">
                {format(d, "MMM")}
            </span>
        </div>
    );
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
    const style = STATUS_STYLE[status] ?? FALLBACK_STATUS_STYLE;
    return (
        <span
            className={[
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border",
                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                style.badge,
            ].join(" ")}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {TRIP_STATUS_LABELS[status] ?? status}
        </span>
    );
};

const RouteBand: React.FC<{ routeName: string; tripType: string; className?: string }> = ({
    routeName,
    tripType,
    className = "",
}) => {
    const t = TYPE_STYLE[tripType as keyof typeof TYPE_STYLE] ?? TYPE_STYLE.PICKUP;
    return (
        <div
            className={[
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5",
                t.band,
                className,
            ].join(" ")}
        >
            <div className="flex min-w-0 items-center gap-2">
                {t.icon}
                <span className="truncate text-xs font-semibold text-slate-700">
                    {routeName}
                </span>
            </div>
            <span
                className={[
                    "shrink-0 rounded-full border bg-white px-2 py-0.5",
                    "text-[10px] font-bold uppercase tracking-wide",
                    t.badge,
                ].join(" ")}
            >
                {t.label}
            </span>
        </div>
    );
};

const InfoTile: React.FC<{
    icon : React.ReactNode;
    label: string;
    value: string | null;
    emptyText: string;
}> = ({ icon, label, value, emptyText }) => (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
        <span className="shrink-0 text-blue-500">{icon}</span>
        <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                {label}
            </p>
            <p
                className={[
                    "truncate text-xs font-bold",
                    value ? "text-slate-800" : "text-amber-500",
                ].join(" ")}
            >
                {value ?? emptyText}
            </p>
        </div>
    </div>
);

// =============================================================================
// Component
// =============================================================================

export const TripCard: React.FC<TripCardProps> = ({
    trip,
    routeName,
    busNumber,
    driverName,
    canEdit,
    variant = "grid",
    onAssign,
    onTransition,
}) => {

    const allowedNext = TRIP_STATUS_TRANSITIONS[trip.trip_status] ?? [];
    const isScheduled = trip.trip_status === "SCHEDULED";
    const isCancelled = trip.trip_status === "CANCELLED";
    const showActions = canEdit && (isScheduled || allowedNext.length > 0);

    // ── Actions (shared by both variants) ────────────────────────────────────
    const actions = showActions ? (
        <>
            {isScheduled ? (
                <button
                    type="button"
                    onClick={() => onAssign(trip)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                >
                    <Pencil size={12} strokeWidth={2.5} />
                    Edit
                </button>
            ) : (
                <span />
            )}

            {allowedNext.map((next) => {
                const cfg = TRANSITION_BUTTONS[next];
                if (!cfg) return null;
                return (
                    <button
                        key={next}
                        type="button"
                        onClick={() => onTransition(trip, next)}
                        className={[
                            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                            "text-xs font-semibold transition-colors",
                            cfg.className,
                        ].join(" ")}
                    >
                        {cfg.icon}
                        {cfg.label}
                    </button>
                );
            })}
        </>
    ) : null;

    // ── List variant ─────────────────────────────────────────────────────────
    if (variant === "list") {
        return (
            <BaseCard className={isCancelled ? "opacity-60" : ""}>
                <div className="grid grid-cols-1 items-center gap-4 px-5 py-3.5 lg:grid-cols-[minmax(200px,1.2fr)_minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto]">
                    <div className="flex min-w-0 items-center gap-3">
                        <DateBlock date={trip.service_date} status={trip.trip_status} />
                        <div className="min-w-0">
                            <RouteBand routeName={routeName} tripType={trip.trip_type} />
                        </div>
                        <StatusPill status={trip.trip_status} />
                    </div>
                    <InfoTile
                        icon={<Bus size={14} />}
                        label="Bus"
                        value={busNumber}
                        emptyText="Not assigned"
                    />
                    <InfoTile
                        icon={<User size={14} />}
                        label="Driver"
                        value={driverName}
                        emptyText="Not assigned"
                    />

                    <div className="flex items-center justify-end gap-1">
                        {actions}
                    </div>
                </div>
            </BaseCard>
        );
    }

    // ── Grid variant ─────────────────────────────────────────────────────────
    return (
        <BaseCard className={isCancelled ? "opacity-60" : ""}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-2 px-5 pt-5 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <DateBlock date={trip.service_date} status={trip.trip_status} />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                            {routeName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                            {format(parseISO(trip.service_date), "dd MMM yyyy")}
                        </p>
                    </div>
                </div>
                <StatusPill status={trip.trip_status} />
            </div>

            {/* ── Route band ─────────────────────────────────────────── */}
            <RouteBand
                routeName={routeName}
                tripType={trip.trip_type}
                className="mx-5 mb-3"
            />

            {/* ── Bus + driver tiles ─────────────────────────────────── */}
            <div className="mx-5 mb-4 flex gap-2">
                <InfoTile
                    icon={<Bus size={14} />}
                    label="Bus"
                    value={busNumber}
                    emptyText="Not assigned"
                />
                <InfoTile
                    icon={<User size={14} />}
                    label="Driver"
                    value={driverName}
                    emptyText="Not assigned"
                />
            </div>

            {/* ── Footer actions ─────────────────────────────────────── */}
            <div
                className={[
                    "mt-auto flex min-h-[52px] items-center justify-between gap-2",
                    "border-t border-slate-100 px-4 py-2.5",
                ].join(" ")}
            >
                {actions}
            </div>
        </BaseCard>
    );
};

export default TripCard;