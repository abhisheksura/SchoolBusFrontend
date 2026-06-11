// src/modules/routes/components/RouteCard.tsx
//
// Displays a single Route as a card in the RoutesListPage grid.
//
// Features:
//   - route_code monospace badge + route_name as heading
//   - Active / Inactive status pill
//   - School + branch meta rows (shown for SUPER_ADMIN / SCHOOL_ADMIN)
//   - Creation date
//   - "View Stops →" CTA that navigates to /routes/:routeId
//   - Edit + Toggle active footer actions (canEdit guard)

import React                from "react";
import { useNavigate }      from "react-router-dom";
import {
    Route,
    ArrowRight,
    Building2,
    MapPin,
    Calendar,
}                           from "lucide-react";

import {
    StatusBadge,
    CardEditButton,
    ToggleActiveButton,
    BaseCard,
    CardFooter,
}                           from "@/components";
import { formatDate }       from "@/core/utils/formatters";

import type { RouteResponse } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteCardProps {
    route      : RouteResponse;
    /** Show school + branch meta rows — true for SUPER_ADMIN and SCHOOL_ADMIN. */
    showSchool : boolean;
    canEdit    : boolean;
    onEdit     : (route: RouteResponse) => void;
    onToggle   : (route: RouteResponse) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RouteCard
 *
 * Card representation of a single route.
 * Clicking the card or "View Stops" button navigates to /routes/:routeId.
 * Footer actions (Edit / Toggle active) are only shown when canEdit is true.
 */
export const RouteCard: React.FC<RouteCardProps> = ({
    route,
    showSchool,
    canEdit,
    onEdit,
    onToggle,
}) => {
    const navigate = useNavigate();

    /** Navigate to the stops detail page for this route. */
    const goToStops = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        navigate(`/routes/${route.route_id}/stops`, {
            state: {
                breadcrumbLabel: route.route_name,
                schoolId: route.school_id,   // Passed here
                branchId: route.branch_id,
            },
        });
    };

    return (
        <BaseCard clickable onClick={goToStops}>

            {/* ── Header: icon + code badge + name + status ──────────────── */}
            <div className="flex items-start justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                        <Route size={20} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                        {/* Monospace route_code badge */}
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-widest text-slate-500 mb-1">
                            {route.route_code}
                        </span>
                        {/* Human-readable name */}
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                            {route.route_name}
                        </p>
                    </div>
                </div>
                <StatusBadge active={route.is_active} />
            </div>

            {/* ── Meta rows ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 px-5 pb-3">
                {showSchool && (
                    <>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Building2 size={11} className="shrink-0 text-slate-400" />
                            <span className="truncate">{route.school_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MapPin size={11} className="shrink-0 text-slate-400" />
                            <span className="truncate">{route.branch_name}</span>
                        </div>
                    </>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={11} className="shrink-0" />
                    <span>Added {formatDate(route.created_at)}</span>
                </div>
            </div>

            {/* ── View Stops CTA ───────────────────────────────────────────── */}
            <div className="mx-5 mb-4">
                <button
                    type="button"
                    onClick={goToStops}
                    className={[
                        "flex w-full items-center justify-between",
                        "rounded-xl bg-indigo-50 border border-indigo-100",
                        "px-4 py-2.5",
                        "text-xs font-semibold text-indigo-600",
                        "hover:bg-indigo-100 hover:border-indigo-200 transition-colors",
                    ].join(" ")}
                >
                    <span>View &amp; Manage stops</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                </button>
            </div>

            {/* ── Footer actions ───────────────────────────────────────────── */}
            {canEdit && (
                <CardFooter>
                    <CardEditButton onClick={() => onEdit(route)} />
                    <div className="h-6 w-px bg-slate-100" />
                    <ToggleActiveButton
                        isActive={route.is_active}
                        onClick={() => onToggle(route)}
                    />
                </CardFooter>
            )}
        </BaseCard>
    );
};