// src/features/trips/pages/TripsListPage.tsx
//
// Route:   /trips
// Access:  SCHOOL_ADMIN, BRANCH_ADMIN (SUPER_ADMIN bypasses via RoleGuard)
//
// Layout (top → bottom):
//   • Page header + "Schedule Trip" button
//   • TenantGate (school / branch scope)
//   • Coloured stat pills (Total / Scheduled / In Progress / Completed / Cancelled)
//   • Filter bar: search · date picker · status tabs · type tabs · refresh · grid/list
//   • TripCard grid (or compact list)
//   • Pagination
//   • Schedule modal · Assign-assets slide-over · Confirm transition modal
//
// Server-side filters : school/branch, status, service_date, pagination
// Client-side filters : trip type, free-text search (trip #, route, bus, driver)

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Navigation,
    Loader2,
    Search,
    CalendarDays,
    X,
    RefreshCw,
    LayoutGrid,
    List,
    Sunrise,
    Sunset,
} from "lucide-react";
import { toast }       from "sonner";
import { z }           from "zod";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth }                    from "@/features/auth/";
import { useTenantGate }              from "@/tenant/hooks/useTenantGate";
import { useDebounce, usePagination } from "@/core";
import {
    EmptyState,
    EntityModal,
    ConfirmModal,
    useEntityModal,
} from "@/components";
import { TenantGate }  from "@/tenant";
import { getRoutes }   from "@/features/routes/api";
import { getBuses }    from "@/features/buses/api";
import { getDrivers }  from "@/features/users/api";
import {
    getTrips,
    createTrip,
    updateTripStatus,
    assignTripAssets,
} from "../api";
import { TripCard }          from "../components/TripCard";
import { TripForm }          from "../components/TripForm";
import type { TripFormData } from "../components/TripForm";
import type { TripStatus }   from "../constants";
import type { TripResponse } from "../types";

// =============================================================================
// Helpers
// =============================================================================

/** Empty <select> → null, otherwise a number (valueAsNumber gives NaN for ""). */
const toNullableNumber = (v: unknown): number | null =>
    v === "" || v === null || v === undefined || Number.isNaN(Number(v))
        ? null
        : Number(v);

const fullName = (first: string, last: string | null): string =>
    [first, last].filter(Boolean).join(" ");

// =============================================================================
// StatPill — coloured number + label (local; matches the trips screen design)
// =============================================================================

type StatTone = "default" | "blue" | "orange" | "green" | "slate";

const STAT_TONE: Record<StatTone, string> = {
    default: "text-slate-800",
    blue   : "text-blue-600",
    orange : "text-orange-500",
    green  : "text-emerald-600",
    slate  : "text-slate-400",
};

const TripStat: React.FC<{ value: number; label: string; tone?: StatTone }> = ({
    value,
    label,
    tone = "default",
}) => (
    <div className="flex items-baseline gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <span className={`text-2xl font-bold tabular-nums ${STAT_TONE[tone]}`}>
            {value}
        </span>
        <span className="text-sm text-slate-500">{label}</span>
    </div>
);

// =============================================================================
// Segmented — small tab group used for status / type / view toggles
// =============================================================================

interface SegmentedOption<T extends string> {
    value : T;
    label : string;
    icon ?: React.ReactNode;
}

interface SegmentedProps<T extends string> {
    options : SegmentedOption<T>[];
    value   : T;
    onChange: (value: T) => void;
    /** Hide text labels (icon-only), e.g. for the grid/list toggle. */
    iconOnly?: boolean;
}

function Segmented<T extends string>({
    options,
    value,
    onChange,
    iconOnly = false,
}: SegmentedProps<T>) {
    return (
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    title={iconOnly ? o.label : undefined}
                    aria-label={o.label}
                    onClick={() => onChange(o.value)}
                    className={[
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                        "text-xs font-medium transition-colors",
                        value === o.value
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-400 hover:text-slate-600",
                    ].join(" ")}
                >
                    {o.icon}
                    {!iconOnly && o.label}
                </button>
            ))}
        </div>
    );
}

// =============================================================================
// Assign assets slide-over
// =============================================================================

const assignSchema = z
    .object({
        bus_id   : z.number().int().positive().nullable(),
        driver_id: z.number().int().positive().nullable(),
    })
    .refine((d) => d.bus_id != null || d.driver_id != null, {
        message: "Assign at least a bus or a driver.",
        path   : ["bus_id"],
    });

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignAssetsPanelProps {
    trip     : TripResponse | null;
    schoolId : number;
    branchId : number;
    onClose  : () => void;
    onSuccess: () => void;
}

const AssignAssetsPanel: React.FC<AssignAssetsPanelProps> = ({
    trip,
    schoolId,
    branchId,
    onClose,
    onSuccess,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AssignFormData>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            bus_id   : trip?.bus_id    ?? null,
            driver_id: trip?.driver_id ?? null,
        },
    });

    const { data: busesData } = useQuery({
        queryKey : ["trips", "assign", "buses", { schoolId, branchId }],
        queryFn  : () =>
            getBuses({ school_id: schoolId, branch_id: branchId, active_only: true, page_size: 100 }),
        staleTime: 60_000,
    });
    const { data: driversData } = useQuery({
        queryKey : ["trips", "assign", "drivers", { schoolId, branchId }],
        queryFn  : () =>
            getDrivers({ school_id: schoolId, branch_id: branchId, page_size: 100 }),
        staleTime: 60_000,
    });

    const assignMutation = useMutation({
        mutationFn: (data: AssignFormData) =>
            assignTripAssets(trip!.trip_id, schoolId, branchId, {
                bus_id   : data.bus_id,
                driver_id: data.driver_id,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            toast.success("Assets assigned to trip");
            onSuccess();
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to assign assets"),
    });

    if (!trip) return null;

    const SELECT =
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm " +
        "text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                            Assign Assets
                        </p>
                        <h2 className="text-lg font-bold text-slate-800">
                            Trip #{trip.trip_id}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit((d) => assignMutation.mutate(d))}
                    className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
                >
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bus
                        </label>
                        <select
                            {...register("bus_id", { setValueAs: toNullableNumber })}
                            className={SELECT}
                        >
                            <option value="">No bus</option>
                            {(busesData?.items ?? []).map((b) => (
                                <option key={b.bus_id} value={b.bus_id}>
                                    {b.bus_number} ({b.capacity} seats)
                                </option>
                            ))}
                        </select>
                        {errors.bus_id && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.bus_id.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Driver
                        </label>
                        <select
                            {...register("driver_id", { setValueAs: toNullableNumber })}
                            className={SELECT}
                        >
                            <option value="">No driver</option>
                            {(driversData?.items ?? []).map((d) => (
                                <option key={d.driver_id} value={d.driver_id}>
                                    {fullName(d.first_name, d.last_name)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1" />

                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={assignMutation.isPending}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-70"
                        >
                            {assignMutation.isPending && (
                                <Loader2 size={14} className="animate-spin" />
                            )}
                            Save Assignment
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

// =============================================================================
// Confirm transition modal config
// =============================================================================

const TRANSITION_CONFIRM: Record<
    string,
    { title: string; message: string; label: string; danger: boolean }
> = {
    IN_PROGRESS: {
        title  : "Start Trip",
        message: "Mark this trip as In Progress? The actual start time will be recorded.",
        label  : "Start Trip",
        danger : false,
    },
    COMPLETED: {
        title  : "Complete Trip",
        message: "Mark this trip as Completed? The actual end time will be recorded.",
        label  : "Complete Trip",
        danger : false,
    },
    CANCELLED: {
        title  : "Cancel Trip",
        message: "Are you sure you want to cancel this trip? This action cannot be undone.",
        label  : "Cancel Trip",
        danger : true,
    },
};

// =============================================================================
// Page
// =============================================================================

type StatusFilter =
    | "ALL" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TypeFilter = "ALL" | "PICKUP" | "DROPOFF";
type ViewMode   = "grid" | "list";

const STATUS_OPTIONS: SegmentedOption<StatusFilter>[] = [
    { value: "ALL",         label: "All"       },
    { value: "SCHEDULED",   label: "Scheduled" },
    { value: "IN_PROGRESS", label: "Active"    },
    { value: "COMPLETED",   label: "Done"      },
    { value: "CANCELLED",   label: "Cancelled" },
];

const TYPE_OPTIONS: SegmentedOption<TypeFilter>[] = [
    { value: "ALL",     label: "All Types" },
    { value: "PICKUP",  label: "Pickup", icon: <Sunrise size={12} className="text-emerald-500" /> },
    { value: "DROPOFF", label: "Drop",   icon: <Sunset  size={12} className="text-orange-500" /> },
];

const VIEW_OPTIONS: SegmentedOption<ViewMode>[] = [
    { value: "grid", label: "Grid view", icon: <LayoutGrid size={14} /> },
    { value: "list", label: "List view", icon: <List       size={14} /> },
];

const TripsListPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();

    // ── Role flags ────────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");
    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

    // ── Tenant gate ───────────────────────────────────────────────────────────
    const gate = useTenantGate();

    // ── Filters / view ────────────────────────────────────────────────────────
    const [search,       setSearch]       = useState("");
    const [dateFilter,   setDateFilter]   = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [typeFilter,   setTypeFilter]   = useState<TypeFilter>("ALL");
    const [viewMode,     setViewMode]     = useState<ViewMode>("grid");
    const debouncedSearch               = useDebounce(search, 300);
    const { page, pageSize, setPage }   = usePagination(15);

    // ── Modals ────────────────────────────────────────────────────────────────
    const tripModal = useEntityModal<TripResponse>();
    const [assignTrip, setAssignTrip] = useState<TripResponse | null>(null);
    const [confirmTransition, setConfirmTransition] = useState<{
        trip  : TripResponse;
        status: TripStatus;
    } | null>(null);

    // ── Lookup data — routes / buses / drivers for name resolution ───────────
    const lookupEnabled = gate.scopeReady;
    const schoolId = gate.resolvedSchoolId;
    const branchId = gate.resolvedBranchId;

    const { data: routesData } = useQuery({
        queryKey : ["trips", "lookup", "routes", schoolId, branchId],
        queryFn  : () =>
            getRoutes({ school_id: schoolId!, branch_id: branchId!, page_size: 100 }),
        enabled  : lookupEnabled,
        staleTime: 60_000,
    });
    const { data: busesData } = useQuery({
        queryKey : ["trips", "lookup", "buses", schoolId, branchId],
        queryFn  : () =>
            getBuses({ school_id: schoolId!, branch_id: branchId!, page_size: 100 }),
        enabled  : lookupEnabled,
        staleTime: 60_000,
    });
    const { data: driversData } = useQuery({
        queryKey : ["trips", "lookup", "drivers", schoolId, branchId],
        queryFn  : () =>
            getDrivers({ school_id: schoolId!, branch_id: branchId!, page_size: 100 }),
        enabled  : lookupEnabled,
        staleTime: 60_000,
    });

    const routeNameMap = useMemo(
        () =>
            new Map(
                (routesData?.items ?? []).map((r) => [
                    r.route_id,
                    `${r.route_code} - ${r.route_name}`,
                ]),
            ),
        [routesData],
    );
    const busNumberMap = useMemo(
        () => new Map((busesData?.items ?? []).map((b) => [b.bus_id, b.bus_number])),
        [busesData],
    );
    const driverNameMap = useMemo(
        () =>
            new Map(
                (driversData?.items ?? []).map((d) => [
                    d.driver_id,
                    fullName(d.first_name, d.last_name),
                ]),
            ),
        [driversData],
    );

    // ── Trips query ───────────────────────────────────────────────────────────
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: [
            "trips",
            {
                school_id: schoolId,
                branch_id: branchId,
                page,
                pageSize,
                statusFilter,
                dateFilter,
            },
        ],
        queryFn: () =>
            getTrips({
                school_id   : schoolId!,
                branch_id   : branchId!,
                page,
                page_size   : pageSize,
                trip_status : statusFilter === "ALL" ? undefined : statusFilter,
                service_date: dateFilter || undefined,
            }),
        enabled  : gate.scopeReady,
        staleTime: 30_000,
    });

    const allTrips   = data?.items ?? [];
    const total      = data?.total ?? 0;
    const totalPages = data?.pages ?? 1;

    // Stat counts — from the current page (same approach as the other list pages)
    const count = (s: string) => allTrips.filter((t) => t.trip_status === s).length;

    // Name resolvers shared by filtering + rendering
    const routeNameOf  = (t: TripResponse) =>
        routeNameMap.get(t.route_id) ?? `Route #${t.route_id}`;
    const busNumberOf  = (t: TripResponse) =>
        t.bus_id ? (busNumberMap.get(t.bus_id) ?? `Bus #${t.bus_id}`) : null;
    const driverNameOf = (t: TripResponse) =>
        t.driver_id ? (driverNameMap.get(t.driver_id) ?? `Driver #${t.driver_id}`) : null;

    // Client-side filters: type + free-text search
    const trips = allTrips.filter((t) => {
        if (typeFilter !== "ALL" && t.trip_type !== typeFilter) return false;
        if (!debouncedSearch) return true;
        const q = debouncedSearch.toLowerCase();
        return [
            `trip #${t.trip_id}`,
            String(t.trip_id),
            routeNameOf(t),
            busNumberOf(t) ?? "",
            driverNameOf(t) ?? "",
        ].some((field) => field.toLowerCase().includes(q));
    });

    const hasActiveFilters =
        !!debouncedSearch || !!dateFilter || statusFilter !== "ALL" || typeFilter !== "ALL";

    // ── Mutations ─────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createTrip,
        onSuccess : () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            toast.success("Trip scheduled");
            tripModal.close();
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to schedule trip"),
    });

    const transitionMutation = useMutation({
        mutationFn: ({ trip, status }: { trip: TripResponse; status: TripStatus }) =>
            updateTripStatus(trip.trip_id, trip.school_id, trip.branch_id, {
                trip_status: status,
            }),
        onSuccess: (_, { status }) => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            toast.success(
                status === "IN_PROGRESS" ? "Trip started" :
                status === "COMPLETED"   ? "Trip completed" :
                                           "Trip cancelled",
            );
            setConfirmTransition(null);
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to update trip status"),
    });

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleCreate = async (formData: TripFormData): Promise<void> => {
        await createMutation.mutateAsync({
            school_id   : schoolId!,
            branch_id   : branchId!,
            route_id    : formData.route_id,
            service_date: formData.service_date,
            trip_type   : formData.trip_type,
            bus_id      : formData.bus_id    ?? null,
            driver_id   : formData.driver_id ?? null,
        });
    };

    const handleOpenCreate = (): void => {
        if (!gate.scopeReady) {
            toast.error("Please select a school and branch first.");
            return;
        }
        tripModal.openCreate();
    };

    const clearFilters = (): void => {
        setSearch("");
        setDateFilter("");
        setStatusFilter("ALL");
        setTypeFilter("ALL");
        setPage(1);
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-5">

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Trips
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a School and Branch, then manage its Trips."
                            : isSchoolAdmin
                                ? "Select a Branch to view and manage its Trips."
                                : "Schedule and manage bus trips — assign routes, buses, and drivers."
                        }
                    </p>
                </div>

                {canEdit && (
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        disabled={!gate.scopeReady}
                        title={
                            gate.scopeReady
                                ? undefined
                                : "Select a School and Branch first"
                        }
                        className={[
                            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                            "text-sm font-semibold text-white shadow-sm transition-colors",
                            gate.scopeReady
                                ? "bg-blue-500 hover:bg-blue-600"
                                : "cursor-not-allowed bg-slate-300",
                        ].join(" ")}
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Schedule Trip
                    </button>
                )}
            </div>

            {/* ── Tenant gate ──────────────────────────────────────────────── */}
            <TenantGate gate={gate} />

            {!gate.scopeReady ? (
                <EmptyState
                    icon={<Navigation size={24} className="text-blue-400" />}
                    title={
                        gate.resolvedSchoolId
                            ? "Select a Branch to continue"
                            : "Select a School to continue"
                    }
                    description={
                        gate.resolvedSchoolId
                            ? "Pick a Branch above to view and schedule its Trips."
                            : "Pick a School first, then choose a Branch."
                    }
                    variant="scope"
                />
            ) : (
                <>
                    {/* ── Stat pills ─────────────────────────────────────── */}
                    <div className="flex flex-wrap gap-3">
                        <TripStat value={total}                  label="Total" />
                        <TripStat value={count("SCHEDULED")}   label="Scheduled"   tone="blue" />
                        <TripStat value={count("IN_PROGRESS")} label="In Progress" tone="orange" />
                        <TripStat value={count("COMPLETED")}   label="Completed"   tone="green" />
                        <TripStat value={count("CANCELLED")}   label="Cancelled"   tone="slate" />
                    </div>

                    {/* ── Filter bar ─────────────────────────────────────── */}
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

                        {/* Search */}
                        <div className="relative min-w-[220px] flex-1">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search trip #, route, bus, driver…"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* Date picker + clear */}
                        <div className="flex items-center gap-1.5">
                            <div className="relative">
                                <CalendarDays
                                    size={14}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => {
                                        setDateFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                                />
                            </div>
                            {dateFilter && (
                                <button
                                    type="button"
                                    onClick={() => { setDateFilter(""); setPage(1); }}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    aria-label="Clear date"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Status tabs */}
                        <Segmented
                            options={STATUS_OPTIONS}
                            value={statusFilter}
                            onChange={(v) => { setStatusFilter(v); setPage(1); }}
                        />

                        {/* Type tabs */}
                        <Segmented
                            options={TYPE_OPTIONS}
                            value={typeFilter}
                            onChange={setTypeFilter}
                        />

                        {/* Refresh */}
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-60"
                            aria-label="Refresh trips"
                            title="Refresh"
                        >
                            <RefreshCw
                                size={14}
                                className={isFetching ? "animate-spin" : ""}
                            />
                        </button>

                        {/* Grid / list toggle */}
                        <Segmented
                            options={VIEW_OPTIONS}
                            value={viewMode}
                            onChange={setViewMode}
                            iconOnly
                        />
                    </div>

                    {/* ── Trip cards ─────────────────────────────────────── */}
                    {isLoading ? (
                        <div
                            className={
                                viewMode === "grid"
                                    ? "grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
                                    : "flex flex-col gap-2"
                            }
                        >
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={[
                                        "animate-pulse rounded-2xl bg-slate-100",
                                        viewMode === "grid" ? "h-64" : "h-20",
                                    ].join(" ")}
                                />
                            ))}
                        </div>
                    ) : trips.length === 0 ? (
                        <EmptyState
                            emoji={hasActiveFilters ? "🔍" : "🚌"}
                            title={hasActiveFilters ? "No trips match your filters" : "No trips yet"}
                            description={
                                hasActiveFilters
                                    ? "Try adjusting or clearing the filters above."
                                    : "Schedule the first trip for this branch."
                            }
                            action={
                                !hasActiveFilters && canEdit
                                    ? { label: "Schedule a trip", onClick: handleOpenCreate }
                                    : undefined
                            }
                        />
                    ) : (
                        <div
                            className={
                                viewMode === "grid"
                                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                                    : "flex flex-col gap-2"
                            }
                        >
                            {trips.map((trip) => (
                                <TripCard
                                    key={trip.trip_id}
                                    trip={trip}
                                    routeName={routeNameOf(trip)}
                                    busNumber={busNumberOf(trip)}
                                    driverName={driverNameOf(trip)}
                                    canEdit={canEdit}
                                    variant={viewMode}
                                    onAssign={setAssignTrip}
                                    onTransition={(t, s) =>
                                        setConfirmTransition({ trip: t, status: s })
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {hasActiveFilters && trips.length > 0 && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="self-center text-xs font-semibold text-blue-500 hover:underline"
                        >
                            Clear all filters
                        </button>
                    )}

                    {/* ── Pagination ─────────────────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                            <p className="text-xs text-slate-400">
                                Page {page} of {totalPages} · {total} trips
                            </p>
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page <= 1}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= totalPages}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Schedule Trip modal ──────────────────────────────────────── */}
            <EntityModal
                open={tripModal.open}
                mode="create"
                entityName="Trip"
                onClose={tripModal.close}
                size="md"
                createSubtitle="Bus and driver can be assigned after scheduling"
            >
                <TripForm
                    trip={tripModal.item ?? undefined}
                    routes={routesData?.items ?? []}
                    buses={busesData?.items ?? []}
                    drivers={driversData?.items ?? []}
                    routesLoading={!routesData}
                    busesLoading={!busesData}
                    driversLoading={!driversData}
                    onSubmit={handleCreate}
                    onCancel={tripModal.close}
                    isLoading={createMutation.isPending}
                />
            </EntityModal>

            {/* ── Assign Assets slide-over ─────────────────────────────────── */}
            {assignTrip && gate.scopeReady && (
                <AssignAssetsPanel
                    trip={assignTrip}
                    schoolId={schoolId!}
                    branchId={branchId!}
                    onClose={() => setAssignTrip(null)}
                    onSuccess={() => setAssignTrip(null)}
                />
            )}

            {/* ── Confirm status transition ────────────────────────────────── */}
            {confirmTransition && (
                <ConfirmModal
                    open={!!confirmTransition}
                    title={TRANSITION_CONFIRM[confirmTransition.status].title}
                    message={TRANSITION_CONFIRM[confirmTransition.status].message}
                    confirmLabel={TRANSITION_CONFIRM[confirmTransition.status].label}
                    danger={TRANSITION_CONFIRM[confirmTransition.status].danger}
                    isLoading={transitionMutation.isPending}
                    onConfirm={() => transitionMutation.mutate(confirmTransition)}
                    onCancel={() => setConfirmTransition(null)}
                />
            )}
        </div>
    );
};

export default TripsListPage;