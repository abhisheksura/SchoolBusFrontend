// src/modules/routes/pages/RouteStopsPage.tsx
//
// Route:  /routes/:routeId/stops
// Access: SCHOOL_ADMIN, BRANCH_ADMIN (SUPER_ADMIN bypasses via RoleGuard)
//
// ─── What this page does ──────────────────────────────────────────────────────
//
//   Shows all stops assigned to a specific route, split into two tabs:
//   PICKUP and DROPOFF. Within each tab, stops are ordered by stop_sequence.
//
//   Features:
//     • Two queries — getRoute (header info) + getRouteStops (flat list)
//     • Client-side split: filter by trip_type, sort by stop_sequence
//     • stop_name is now a flat field on every RouteStop — no enrichment needed
//     • Drag-to-reorder via HTML5 drag API → fires reorderRouteStops on drop
//     • "Add Stop" dropdown — shows branch stops not already on this route/tab
//       (still requires a separate getStops call for the available-stops list)
//     • Remove stop — ConfirmModal before removeStopFromRoute
//
// ─── Data flow ────────────────────────────────────────────────────────────────
//
//   [getRoute]      → header (route_code, route_name, is_active)
//   [getRouteStops] → flat RouteStop[] with stop_name included → split by trip_type
//   [getStops]      → StopResponse[] → source for "Add Stop" dropdown only

import React, {
    useState,
    useMemo,
    useRef,
    useCallback,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    MapPin,
    GripVertical,
    Plus,
    Trash2,
    Loader2,
    Route,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/";
import { ConfirmModal, StatusBadge } from "@/components";
import {
    getRoute,
    getRouteWithStops,
    getStops,
    addStopToRoute,
    removeStopFromRoute,
    reorderRouteStops,
} from "../api";
import type {
    RouteStop,
    TripType,
    StopResponse,
} from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Tailwind colour tokens per trip type tab */
const TAB_STYLES: Record<TripType, {
    active  : string;
    inactive: string;
    badge   : string;
    dot     : string;
    drag    : string;
}> = {
    PICKUP: {
        active  : "border-b-2 border-blue-500 text-blue-600 font-semibold",
        inactive: "text-slate-400 hover:text-slate-600",
        badge   : "bg-blue-50 text-blue-600 border border-blue-100",
        dot     : "bg-blue-500",
        drag    : "border-blue-200 hover:border-blue-400",
    },
    DROPOFF: {
        active  : "border-b-2 border-amber-500 text-amber-600 font-semibold",
        inactive: "text-slate-400 hover:text-slate-600",
        badge   : "bg-amber-50 text-amber-600 border border-amber-100",
        dot     : "bg-amber-500",
        drag    : "border-amber-200 hover:border-amber-400",
    },
};

// ---------------------------------------------------------------------------
// Helper — build sorted list for one tab
// ---------------------------------------------------------------------------

/**
 * Filters a flat RouteStop[] to a single trip_type and sorts by stop_sequence.
 * stop_name is now a direct field on RouteStop — no merging required.
 *
 * @param routeStops - Raw RouteStop[] from getRouteStops().
 * @param tripType   - Which tab to build: "PICKUP" or "DROPOFF".
 */
function buildList(
    routeStops: RouteStop[],
    tripType  : TripType,
): RouteStop[] {
    return routeStops
        .filter((rs) => rs.trip_type === tripType)
        .sort((a, b) => a.stop_sequence - b.stop_sequence);
}

// ---------------------------------------------------------------------------
// Sub-component — StopRow
// ---------------------------------------------------------------------------

interface StopRowProps {
    item       : RouteStop;
    index      : number;
    tripType   : TripType;
    isDragging : boolean;
    isDragOver : boolean;
    canEdit    : boolean;
    onDragStart: (index: number) => void;
    onDragOver : (e: React.DragEvent, index: number) => void;
    onDrop     : (e: React.DragEvent, index: number) => void;
    onDragEnd  : () => void;
    onRemove   : (item: RouteStop) => void;
}

/**
 * Single row in the stop list.
 * Reads stop_name directly from the RouteStop item — no nested object needed.
 * Handles drag-and-drop, sequence badge, and remove action.
 */
const StopRow: React.FC<StopRowProps> = ({
    item,
    index,
    tripType,
    isDragging,
    isDragOver,
    canEdit,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onRemove,
}) => {
    const styles = TAB_STYLES[tripType];

    return (
        <div
            draggable={canEdit}
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            onDragEnd={onDragEnd}
            className={[
                "flex items-center gap-3 rounded-xl border bg-white px-4 py-3",
                "transition-all duration-150 select-none",
                isDragOver  ? "border-blue-400 shadow-md scale-[1.01]" : `border-slate-200 ${styles.drag}`,
                isDragging  ? "opacity-40" : "opacity-100",
                canEdit     ? "cursor-grab active:cursor-grabbing" : "",
            ].join(" ")}
        >
            {/* ── Drag handle ───────────────────────── */}
            {canEdit && (
                <GripVertical
                    size={16}
                    className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
                    aria-hidden="true"
                />
            )}

            {/* ── Sequence badge ────────────────────── */}
            <span
                className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center",
                    "rounded-full text-xs font-bold",
                    styles.badge,
                ].join(" ")}
            >
                {item.stop_sequence}
            </span>

            {/* ── Stop details ──────────────────────── */}
            <div className="flex flex-1 flex-col min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                    {item.stop_name}
                </p>
                {item.estimated_time && (
                    <p className="text-xs text-slate-400">
                        ETA {item.estimated_time}
                    </p>
                )}
            </div>

            {/* ── Stop ID chip ───────────────────────── */}
            <span className="hidden sm:inline-flex shrink-0 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                #{item.stop_id}
            </span>

            {/* ── Remove button ─────────────────────── */}
            {canEdit && (
                <button
                    type="button"
                    onClick={() => onRemove(item)}
                    className={[
                        "shrink-0 flex h-7 w-7 items-center justify-center",
                        "rounded-lg text-slate-300 transition-colors",
                        "hover:bg-red-50 hover:text-red-500",
                    ].join(" ")}
                    aria-label={`Remove ${item.stop_name} from route`}
                >
                    <Trash2 size={14} strokeWidth={2} />
                </button>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Sub-component — AddStopDropdown
// ---------------------------------------------------------------------------

interface AddStopDropdownProps {
    availableStops   : StopResponse[];
    tripType         : TripType;
    isAdding         : boolean;
    onAdd            : (stop: StopResponse) => void;
}

/**
 * Dropdown panel listing stops that can be added to this tab.
 * Filters out stops already present on the route for this trip_type.
 */
const AddStopDropdown: React.FC<AddStopDropdownProps> = ({
    availableStops,
    tripType,
    isAdding,
    onAdd,
}) => {
    const [open, setOpen] = useState(false);
    const styles = TAB_STYLES[tripType];

    if (availableStops.length === 0 && !isAdding) {
        return (
            <p className="text-xs text-slate-400 py-2 text-center">
                All available stops are already on this route.
            </p>
        );
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                disabled={isAdding || availableStops.length === 0}
                className={[
                    "flex items-center gap-1.5 rounded-xl px-4 py-2.5",
                    "text-sm font-semibold text-white transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    tripType === "PICKUP"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-amber-500 hover:bg-amber-600",
                ].join(" ")}
            >
                {isAdding
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Plus size={14} strokeWidth={2.5} />
                }
                Add Stop
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Dropdown panel */}
                    <div
                        className={[
                            "absolute right-0 top-full mt-2 z-20",
                            "w-72 rounded-xl border border-slate-200 bg-white shadow-xl",
                            "max-h-64 overflow-y-auto",
                        ].join(" ")}
                    >
                        <div className="px-3 py-2 border-b border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Select a stop to add
                            </p>
                        </div>

                        {availableStops.map((stop) => (
                            <button
                                key={stop.stop_id}
                                type="button"
                                onClick={() => {
                                    onAdd(stop);
                                    setOpen(false);
                                }}
                                className={[
                                    "flex w-full items-center gap-3 px-3 py-2.5",
                                    "text-left text-sm transition-colors",
                                    "hover:bg-slate-50",
                                ].join(" ")}
                            >
                                <MapPin
                                    size={14}
                                    className={
                                        tripType === "PICKUP"
                                            ? "text-blue-400 shrink-0"
                                            : "text-amber-400 shrink-0"
                                    }
                                />
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-700 truncate">
                                        {stop.stop_name}
                                    </p>
                                    <p className="text-xs text-slate-400 tabular-nums">
                                        {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Sub-component — TabPanel
// ---------------------------------------------------------------------------

interface TabPanelProps {
    tripType       : TripType;
    /** Filtered + sorted stops for this tab — stop_name is a flat field. */
    stops          : RouteStop[];
    availableStops : StopResponse[];
    routeId        : number;
    canEdit        : boolean;
    isAdding       : boolean;
    isReordering   : boolean;
    onAdd          : (stop: StopResponse) => void;
    onRemove       : (item: RouteStop) => void;
    onReorder      : (tripType: TripType, newOrder: RouteStop[]) => void;
}

/**
 * The content panel for one trip-type tab (PICKUP or DROPOFF).
 * Owns the drag-and-drop state for its list.
 */
const TabPanel: React.FC<TabPanelProps> = ({
    tripType,
    stops,
    availableStops,
    routeId,
    canEdit,
    isAdding,
    isReordering,
    onAdd,
    onRemove,
    onReorder,
}) => {
    // Local drag state — index being dragged and index being hovered over
    const dragIndex  = useRef<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((index: number) => {
        dragIndex.current = index;
    }, []);

    const handleDragOver = useCallback(
        (e: React.DragEvent, index: number) => {
            e.preventDefault();
            setOverIndex(index);
        },
        [],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent, dropIndex: number) => {
            e.preventDefault();
            const fromIndex = dragIndex.current;

            if (fromIndex === null || fromIndex === dropIndex) {
                dragIndex.current = null;
                setOverIndex(null);
                return;
            }

            // Reorder the array client-side first for optimistic feel
            const reordered = [...stops];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(dropIndex, 0, moved);

            dragIndex.current = null;
            setOverIndex(null);
            onReorder(tripType, reordered);
        },
        [stops, tripType, onReorder],
    );

    const handleDragEnd = useCallback(() => {
        dragIndex.current = null;
        setOverIndex(null);
    }, []);

    const label = tripType === "PICKUP" ? "Pick-up" : "Drop-off";
    const styles = TAB_STYLES[tripType];

    return (
        <div className="flex flex-col gap-3">

            {/* ── Tab toolbar ───────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className={[
                            "inline-flex items-center rounded-full px-2.5 py-0.5",
                            "text-xs font-semibold",
                            styles.badge,
                        ].join(" ")}
                    >
                        {label}
                    </span>
                    <span className="text-sm text-slate-400">
                        {stops.length}{" "}
                        {stops.length === 1 ? "stop" : "stops"}
                    </span>
                    {isReordering && (
                        <Loader2
                            size={14}
                            className="animate-spin text-slate-400"
                            aria-label="Saving order..."
                        />
                    )}
                </div>

                {canEdit && (
                    <AddStopDropdown
                        availableStops={availableStops}
                        tripType={tripType}
                        isAdding={isAdding}
                        onAdd={onAdd}
                    />
                )}
            </div>

            {/* ── Stop list ─────────────────────────── */}
            {stops.length === 0 ? (
                <div
                    className={[
                        "flex flex-col items-center gap-2 rounded-xl",
                        "border-2 border-dashed border-slate-200 py-12 text-center",
                    ].join(" ")}
                >
                    <MapPin size={28} className="text-slate-200" />
                    <p className="text-sm font-medium text-slate-400">
                        No {label.toLowerCase()} stops added yet
                    </p>
                    {canEdit && (
                        <p className="text-xs text-slate-400">
                            Use the "Add Stop" button to assign stops.
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {stops.map((item, index) => (
                        <StopRow
                            key={item.route_stop_id}
                            item={item}
                            index={index}
                            tripType={tripType}
                            isDragging={dragIndex.current === index}
                            isDragOver={overIndex === index && dragIndex.current !== index}
                            canEdit={canEdit}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            onRemove={onRemove}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Router state shape injected by RoutesListPage when navigating here.
// school_id and branch_id come from the RouteResponse that was already
// fetched by the list page — no extra API call needed.
// ---------------------------------------------------------------------------

interface RouteStopsLocationState {
    breadcrumbLabel?: string;
    schoolId       : number;
    branchId       : number;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

/**
 * RouteStopsPage
 *
 * Displays and manages the ordered stops for a single route, split
 * into PICKUP and DROPOFF tabs.
 *
 * Data strategy:
 *   1. getRoute(routeId)                                  → header data
 *   2. getRouteStops(routeId)                             → flat RouteStop[]
 *      Each item now includes stop_name directly — no secondary lookup needed.
 *   3. getStops({ school_id, branch_id, page_size: 200 }) → "Add Stop" dropdown
 *      school_id + branch_id sourced from router location state.
 *   4. Client-side: filter by trip_type, sort by stop_sequence
 */
const RouteStopsPage: React.FC = () => {
    const { routeId }    = useParams<{ routeId: string }>();
    const navigate       = useNavigate();
    const location       = useLocation();
    const queryClient    = useQueryClient();
    const { hasRole }    = useAuth();

    const parsedRouteId  = Number(routeId);

    // ── Tenant scope from router state ───────────────────────────────────────
    //
    // RoutesListPage passes school_id and branch_id through navigate() state
    // when the user clicks "Manage Stops" on a RouteCard. These values come
    // directly from the RouteResponse, so they are always correct regardless
    // of JWT shape (SUPER_ADMIN has no school/branch in the token at all;
    // SCHOOL_ADMIN has no branch_id).
    //
    // If the user navigates here directly via bookmarked URL or page refresh,
    // locationState will be empty — schoolId/branchId fall back to undefined.
    // The backend enforces tenant scope server-side, so queries still work;
    // the stops dropdown simply fetches without an explicit tenant filter.
    const locationState = (location.state ?? {}) as Partial<RouteStopsLocationState>;
    const schoolId      = locationState.schoolId;
    const branchId      = locationState.branchId;
    //const { schoolId, branchId } = (location.state as RouteStopsLocationState) || {};
    // ── Role helpers ─────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");
    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;
    const parsedSchoolId = Number(schoolId);
    const parsedBranchId = Number(branchId);

    // ── UI state ─────────────────────────────────────────────────────────────
    const [activeTab,    setActiveTab]    = useState<TripType>("PICKUP");
    const [confirmItem,  setConfirmItem]  = useState<RouteStop | null>(null);

    // ── Query 1 — Route header ───────────────────────────────────────────────
    const {
        data : route,
        isLoading: routeLoading,
        isError  : routeError,
    } = useQuery({
        queryKey: ["routes", "detail", parsedRouteId],
        queryFn : () => getRoute(parsedRouteId),
        enabled : !!parsedRouteId,
        staleTime: 60_000,
    });

    // ── Query 2 — Route stops (flat list) ────────────────────────────────────
    const {
        data : routeStops = [],
        isLoading: stopsLoading,
    } = useQuery({
        queryKey: ["route-stops", parsedRouteId, parsedSchoolId, parsedBranchId],
        queryFn : () => getRouteWithStops(parsedRouteId, parsedSchoolId, parsedBranchId),
        enabled : !!parsedRouteId,
        staleTime: 30_000,
    });

    // ── Query 3 — Available stops for the "Add Stop" dropdown ───────────────
    //
    // stop_name is now included on every RouteStop from getRouteStops(), so
    // this query is no longer needed for name resolution. Its sole remaining
    // purpose is populating the "Add Stop" dropdown with stops that exist in
    // this branch but are not yet assigned to this route/tab.
    //
    // school_id + branch_id come from router location state (set by
    // RoutesListPage from the RouteResponse) — reliably correct for all roles.
    //
    // active_only: true — only offer active stops when adding to a route.
    const {
        data: allStopsData,
    } = useQuery({
        queryKey: ["stops", "all-for-route", { schoolId, branchId }],
        queryFn : () => getStops({
            school_id  : schoolId,
            branch_id  : branchId,
            active_only: true,
            page       : 1,
            page_size  : 100,
        }),
        enabled  : !!parsedRouteId,
        staleTime: 60_000,
    });

    const allStops: StopResponse[] = allStopsData?.items ?? [];

    // ── Derived data — sorted lists per tab ──────────────────────────────────

    /**
     * Filtered + sorted stop lists for each tab.
     * stop_name is read directly from each RouteStop item.
     * Rebuilt only when the routeStops array reference changes.
     */
    const pickupStops  = useMemo(
        () => buildList(routeStops, "PICKUP"),
        [routeStops],
    );

    const dropoffStops = useMemo(
        () => buildList(routeStops, "DROPOFF"),
        [routeStops],
    );

    /** Active tab's sorted list — determined once per render. */
    const activeList = activeTab === "PICKUP" ? pickupStops : dropoffStops;

    /**
     * Set of stop_ids already on the active tab.
     * A stop can appear on both PICKUP and DROPOFF independently, so we
     * scope the exclusion to the current tab only.
     */
    const alreadyOnActiveTab = useMemo<Set<number>>(
        () => new Set(activeList.map((s) => s.stop_id)),
        [activeList],
    );

    /**
     * Stops available to add on the active tab:
     *   all branch stops  MINUS  stops already assigned to this route/tab.
     */
    const availableToAdd = useMemo<StopResponse[]>(
        () => allStops.filter((s) => !alreadyOnActiveTab.has(s.stop_id)),
        [allStops, alreadyOnActiveTab],
    );

    // ── Mutation — Add stop ──────────────────────────────────────────────────
    const addMutation = useMutation({
        mutationFn: (stop: StopResponse) => {
            const nextSequence = activeList.length + 1;
            return addStopToRoute({
                route_id     : parsedRouteId,
                stop_id      : stop.stop_id,
                stop_type    : activeTab,
                stop_sequence: nextSequence,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["route-stops", parsedRouteId] });
            toast.success("Stop added to route");
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail || "Failed to add stop"),
    });

    // ── Mutation — Remove stop ───────────────────────────────────────────────
    const removeMutation = useMutation({
        mutationFn: (item: RouteStop) =>
            removeStopFromRoute(item.route_stop_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["route-stops", parsedRouteId] });
            toast.success("Stop removed from route");
            setConfirmItem(null);
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail || "Failed to remove stop"),
    });

    // ── Mutation — Reorder stops ─────────────────────────────────────────────
    const reorderMutation = useMutation({
        mutationFn: ({
            tripType,
            newOrder,
        }: {
            tripType: TripType;
            newOrder: RouteStop[];
        }) =>
            reorderRouteStops(parsedRouteId, {
                stop_type     : tripType,
                stop_ids: newOrder.map((s) => s.route_stop_id),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["route-stops", parsedRouteId] });
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail || "Failed to save new order"),
    });

    // ── Handler — drag-and-drop reorder ─────────────────────────────────────
    const handleReorder = useCallback(
        (tripType: TripType, newOrder: RouteStop[]) => {
            reorderMutation.mutate({ tripType, newOrder });
        },
        [reorderMutation],
    );

    // ── Loading / error states ───────────────────────────────────────────────
    const isLoading = routeLoading || stopsLoading;

    if (routeError) {
        return (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
                <AlertCircle size={32} className="text-red-400" />
                <p className="text-base font-semibold text-slate-700">
                    Route not found
                </p>
                <p className="text-sm text-slate-400">
                    This route may have been removed or you don't have access.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/routes")}
                    className="mt-2 text-sm font-semibold text-blue-500 hover:underline"
                >
                    Back to Routes
                </button>
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-5 max-w-4xl mx-auto">

            {/* ── Page header ─────────────────────────────────────── */}
            <div className="flex items-start gap-3">

                {/* Back button */}
                <button
                    type="button"
                    onClick={() => navigate("/routes")}
                    className={[
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center",
                        "rounded-xl border border-slate-200 bg-white text-slate-500",
                        "hover:border-slate-300 hover:text-slate-700 transition-colors",
                    ].join(" ")}
                    aria-label="Back to Routes"
                >
                    <ArrowLeft size={16} strokeWidth={2} />
                </button>

                <div className="flex flex-1 flex-col gap-1 min-w-0">
                    {isLoading ? (
                        // Skeleton
                        <div className="space-y-2 animate-pulse">
                            <div className="h-6 w-48 rounded bg-slate-100" />
                            <div className="h-4 w-32 rounded bg-slate-100" />
                        </div>
                    ) : route ? (
                        <>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                                        <Route size={16} className="text-blue-500" />
                                    </div>
                                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                                        {route.route_name}
                                    </h1>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-500">
                                    {route.route_code}
                                </span>
                                <StatusBadge active={route.is_active} />
                            </div>
                            <p className="text-sm text-slate-400">
                                {route.branch_name} · {route.school_name}
                            </p>
                        </>
                    ) : null}
                </div>

                {/* Summary pills */}
                {!isLoading && route && (
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-semibold text-blue-600">
                                {pickupStops.length} Pickup
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="text-xs font-semibold text-amber-600">
                                {dropoffStops.length} Dropoff
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Tab switcher ────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

                {/* Tab bar */}
                <div className="flex border-b border-slate-200">
                    {(["PICKUP", "DROPOFF"] as TripType[]).map((tab) => {
                        const count = tab === "PICKUP"
                            ? pickupStops.length
                            : dropoffStops.length;
                        const styles = TAB_STYLES[tab];
                        const isActive = activeTab === tab;

                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={[
                                    "flex flex-1 items-center justify-center gap-2",
                                    "px-6 py-4 text-sm transition-all duration-150",
                                    isActive ? styles.active : styles.inactive,
                                ].join(" ")}
                                aria-selected={isActive}
                                role="tab"
                            >
                                <span
                                    className={[
                                        "h-2 w-2 rounded-full transition-colors",
                                        isActive ? styles.dot : "bg-slate-300",
                                    ].join(" ")}
                                />
                                {tab === "PICKUP" ? "Pick-up" : "Drop-off"}
                                <span
                                    className={[
                                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                                        isActive ? styles.badge : "bg-slate-100 text-slate-400",
                                    ].join(" ")}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab content */}
                <div className="p-5" role="tabpanel">
                    {isLoading ? (
                        // Loading skeleton
                        <div className="flex flex-col gap-2 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-14 rounded-xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : (
                        <TabPanel
                            key={activeTab}       /* re-mount on tab switch to reset drag state */
                            tripType={activeTab}
                            stops={activeList}
                            availableStops={availableToAdd}
                            routeId={parsedRouteId}
                            canEdit={canEdit}
                            isAdding={addMutation.isPending}
                            isReordering={reorderMutation.isPending}
                            onAdd={(stop) => addMutation.mutate(stop)}
                            onRemove={(item) => setConfirmItem(item)}
                            onReorder={handleReorder}
                        />
                    )}
                </div>
            </div>

            {/* ── Drag-to-reorder hint ─────────────────────────────── */}
            {canEdit && activeList.length > 1 && (
                <p className="text-center text-xs text-slate-400">
                    Drag rows to reorder stops · Changes are saved automatically
                </p>
            )}

            {/* ── Confirm remove dialog ────────────────────────────── */}
            <ConfirmModal
                open={!!confirmItem}
                title="Remove Stop from Route"
                message={
                    confirmItem
                        ? `Remove "${confirmItem.stop_name}" from the ${
                              confirmItem.trip_type === "PICKUP" ? "pick-up" : "drop-off"
                          } sequence? The stop itself will not be deleted.`
                        : ""
                }
                confirmLabel="Remove"
                danger
                isLoading={removeMutation.isPending}
                onConfirm={() => confirmItem && removeMutation.mutate(confirmItem)}
                onCancel={() => setConfirmItem(null)}
            />
        </div>
    );
};

export default RouteStopsPage;