// src/features/trips/pages/TripsListPage.tsx
//
// Route:   /trips
// Access:  SCHOOL_ADMIN, BRANCH_ADMIN (SUPER_ADMIN bypasses via RoleGuard)
//
// Follows the exact same structure as RoutesListPage:
//   • useTenantGate() + TenantGate for scope selection
//   • Date picker + status filter + route filter
//   • TripCard grid with inline status transition buttons
//   • AssignAssets slide-over (bus + driver)
//   • Create trip modal
//   • ConfirmModal for status transitions
//   • StatsGrid + SearchFilterBar primitives

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Navigation, Loader2, Bus, UserCog } from "lucide-react";
import { toast }                    from "sonner";
import { z }                        from "zod";
import { useForm }                  from "react-hook-form";
import { zodResolver }              from "@hookform/resolvers/zod";

import { useAuth }                  from "@/features/auth/";
import { useTenantGate }            from "@/tenant/hooks/useTenantGate";
import { useDebounce, usePagination } from "@/core";
import {
    StatsGrid,
    EmptyState,
    EntityModal,
    ConfirmModal,
    useEntityModal,
}                                   from "@/components";
import { TenantGate }               from "@/tenant";
import { getRoutes }                from "@/features/routes/api";
import { getBuses }                 from "@/modules/buses/api";
import { getDrivers }               from "@/features/users/api";
import {
    getTrips,
    createTrip,
    updateTripStatus,
    assignTripAssets,
}                                   from "../api";
import { TripCard }                 from "../components/TripCard";
import { TripForm }                 from "../components/TripForm";
import type { TripFormData }        from "../components/TripForm";
import type { TripStatus } from "../constants";
import type { TripResponse, TripCreateRequest } from "../types";
// =============================================================================
// Assign assets form — inline slide-over (not a separate component file)
// =============================================================================

const assignSchema = z.object({
    bus_id   : z.number().int().positive().optional().nullable(),
    driver_id: z.number().int().positive().optional().nullable(),
}).refine(
    (d) => d.bus_id != null || d.driver_id != null,
    { message: "Assign at least a bus or a driver." },
);

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignAssetsPanelProps {
    trip      : TripResponse | null;
    schoolId  : number;
    branchId  : number;
    onClose   : () => void;
    onSuccess : () => void;
}

const AssignAssetsPanel: React.FC<AssignAssetsPanelProps> = ({
    trip,
    schoolId,
    branchId,
    onClose,
    onSuccess,
}) => {
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

    const { data: busesData   } = useQuery({
        queryKey : ["buses",    "dropdown", { schoolId, branchId }],
        queryFn  : () => getBuses(schoolId, { branch_id: branchId, active_only: true, page_size: 200 }),
        staleTime: 60_000,
    });
    const { data: driversData } = useQuery({
        queryKey : ["drivers", "dropdown", { schoolId, branchId }],
        queryFn  : () => getDrivers({ school_id: schoolId, branch_id: branchId, is_active: true, page_size: 200 }),
        staleTime: 60_000,
    });

    const queryClient = useQueryClient();
    const assignMutation = useMutation({
        mutationFn: (data: AssignFormData) =>
            assignTripAssets(trip!.trip_id, schoolId, branchId, {
                bus_id   : data.bus_id    ?? null,
                driver_id: data.driver_id ?? null,
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

    const SELECT = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div className="fixed right-0 inset-y-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                            Assign Assets
                        </p>
                        <h2 className="text-lg font-bold text-slate-800">
                            Trip #{trip.trip_id}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                        ✕
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
                        <select {...register("bus_id", { valueAsNumber: true })} className={SELECT}>
                            <option value="">No bus</option>
                            {(busesData?.items ?? []).map((b) => (
                                <option key={b.bus_id} value={b.bus_id}>
                                    {b.bus_number} ({b.capacity} seats)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Driver
                        </label>
                        <select {...register("driver_id", { valueAsNumber: true })} className={SELECT}>
                            <option value="">No driver</option>
                            {(driversData?.items ?? []).map((d) => (
                                <option key={d.driver_id} value={d.driver_id}>
                                    {[d.first_name, d.last_name].filter(Boolean).join(" ")}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errors.root && (
                        <p className="text-xs text-red-500">{errors.root.message}</p>
                    )}
                    <div className="flex-1" />
                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={assignMutation.isPending}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-70"
                        >
                            {assignMutation.isPending && <Loader2 size={14} className="animate-spin" />}
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

const TRANSITION_CONFIRM: Record<TripStatus, { title: string; message: string; label: string; danger: boolean }> = {
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
    SCHEDULED : { title: "", message: "", label: "", danger: false },
};

// =============================================================================
// Page
// =============================================================================

type StatusFilter = "ALL" | TripStatus;

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

    // ── Filters ───────────────────────────────────────────────────────────────
    const [dateFilter,   setDateFilter]   = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [routeFilter,  setRouteFilter]  = useState<number | undefined>(undefined);
    const { page, pageSize, setPage }     = usePagination(15);

    // ── Modals ────────────────────────────────────────────────────────────────
    const tripModal                                  = useEntityModal<TripResponse>();
    const [assignTrip,  setAssignTrip]               = useState<TripResponse | null>(null);
    const [confirmTransition, setConfirmTransition]  = useState<{ trip: TripResponse; status: TripStatus } | null>(null);

    // ── Routes dropdown for filter bar ────────────────────────────────────────
    const { data: routesData } = useQuery({
        queryKey : ["routes", "dropdown", gate.resolvedSchoolId, gate.resolvedBranchId],
        queryFn  : () =>
            getRoutes({ school_id: gate.resolvedSchoolId!, branch_id: gate.resolvedBranchId!, active_only: true, page_size: 200 }),
        enabled  : gate.scopeReady,
        staleTime: 60_000,
    });
    const routeOptions = routesData?.items ?? [];

    // ── Trips query ───────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: [
            "trips",
            {
                school_id  : gate.resolvedSchoolId,
                branch_id  : gate.resolvedBranchId,
                page,
                pageSize,
                statusFilter,
                dateFilter,
                routeFilter,
            },
        ],
        queryFn: () =>
            getTrips({
                school_id   : gate.resolvedSchoolId!,
                branch_id   : gate.resolvedBranchId!,
                page,
                page_size   : pageSize,
                trip_status : statusFilter === "ALL" ? undefined : statusFilter,
                service_date: dateFilter   || undefined,
                route_id    : routeFilter,
            }),
        enabled  : gate.scopeReady,
        staleTime: 30_000,
    });

    const allTrips    = data?.items ?? [];
    const total       = data?.total  ?? 0;
    const totalPages  = data?.pages  ?? 1;

    // Stat counts from current page
    const scheduledCount   = allTrips.filter((t) => t.trip_status === "SCHEDULED").length;
    const inProgressCount  = allTrips.filter((t) => t.trip_status === "IN_PROGRESS").length;
    const completedCount   = allTrips.filter((t) => t.trip_status === "COMPLETED").length;
    const cancelledCount   = allTrips.filter((t) => t.trip_status === "CANCELLED").length;

    // ── Lookup maps — resolve route / bus / driver names from cached data ─────
    //
    // We already fetched routes above for the filter dropdown.
    // Buses and drivers would need separate lookup queries for full names.
    // For the list view, we show the IDs with a placeholder; detail page shows full names.
    const routeNameMap = useMemo(
        () => new Map(routeOptions.map((r) => [r.route_id, `${r.route_code} — ${r.route_name}`])),
        [routeOptions],
    );

    // ── Create mutation ───────────────────────────────────────────────────────
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

    // ── Status transition mutation ────────────────────────────────────────────
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
            school_id   : gate.resolvedSchoolId!,
            branch_id   : gate.resolvedBranchId!,
            route_id    : formData.route_id,
            service_date: formData.service_date,
            trip_type   : formData.trip_type,
            bus_id      : formData.bus_id      ?? null,
            driver_id   : formData.driver_id   ?? null,
        });
    };

    const handleOpenCreate = () => {
        if (!gate.scopeReady) {
            toast.error("Select a school and branch first.");
            return;
        }
        tripModal.openCreate();
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
                            ? "Select a school and branch to manage trips."
                            : isSchoolAdmin
                                ? "Select a branch to view trips."
                                : "Schedule and manage trips for your branch."
                        }
                    </p>
                </div>
                {canEdit && (
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        disabled={!gate.scopeReady}
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
                    title="Select a school and branch to continue"
                    description="Pick a school and branch above to view and schedule trips."
                    variant="scope"
                />
            ) : (
                <>
                    {/* ── Stat pills ─────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: total,          label: "Total"       },
                            { value: scheduledCount, label: "Scheduled",  color: "amber"  },
                            { value: inProgressCount,label: "In Progress",color: "green"  },
                            { value: completedCount, label: "Completed",  color: "default"},
                            { value: cancelledCount, label: "Cancelled",  color: "slate"  },
                        ]}
                    />

                    {/* ── Filter bar ─────────────────────────────────────── */}
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

                        {/* Date picker */}
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                        />

                        {/* Route filter */}
                        <select
                            value={routeFilter ?? ""}
                            onChange={(e) => {
                                setRouteFilter(e.target.value ? Number(e.target.value) : undefined);
                                setPage(1);
                            }}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                        >
                            <option value="">All routes</option>
                            {routeOptions.map((r) => (
                                <option key={r.route_id} value={r.route_id}>
                                    {r.route_code}
                                </option>
                            ))}
                        </select>

                        {/* Status filter tabs */}
                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 ml-auto">
                            {(["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => { setStatusFilter(s); setPage(1); }}
                                    className={[
                                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                                        statusFilter === s
                                            ? "bg-white shadow-sm text-slate-700"
                                            : "text-slate-400 hover:text-slate-600",
                                    ].join(" ")}
                                >
                                    {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Trip cards ─────────────────────────────────────── */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-60 animate-pulse rounded-2xl bg-slate-100" />
                            ))}
                        </div>
                    ) : allTrips.length === 0 ? (
                        <EmptyState
                            emoji="🚌"
                            title="No trips found"
                            description={
                                dateFilter || statusFilter !== "ALL" || routeFilter
                                    ? "Try adjusting the filters above."
                                    : "Schedule the first trip for this branch."
                            }
                            action={
                                !dateFilter && statusFilter === "ALL" && !routeFilter && canEdit
                                    ? { label: "Schedule a trip", onClick: handleOpenCreate }
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {allTrips.map((trip) => (
                                <TripCard
                                    key={trip.trip_id}
                                    trip={trip}
                                    routeName={routeNameMap.get(trip.route_id) ?? `Route #${trip.route_id}`}
                                    busNumber={trip.bus_id ? `Bus #${trip.bus_id}` : null}
                                    driverName={trip.driver_id ? `Driver #${trip.driver_id}` : null}
                                    showSchool={isSuperAdmin || isSchoolAdmin}
                                    canEdit={canEdit}
                                    onAssign={setAssignTrip}
                                    onTransition={(t, s) => setConfirmTransition({ trip: t, status: s })}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Pagination ─────────────────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                            <p className="text-xs text-slate-400">
                                Page {page} of {totalPages} · {total} trips
                            </p>
                            <div className="flex gap-1.5">
                                <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                >
                                    Previous
                                </button>
                                <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
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
                {gate.scopeReady && (
                    <TripForm
                        schoolId={gate.resolvedSchoolId!}
                        branchId={gate.resolvedBranchId!}
                        onSubmit={handleCreate}
                        onCancel={tripModal.close}
                        isLoading={createMutation.isPending}
                    />
                )}
            </EntityModal>

            {/* ── Assign Assets slide-over ─────────────────────────────────── */}
            {assignTrip && gate.scopeReady && (
                <AssignAssetsPanel
                    trip={assignTrip}
                    schoolId={gate.resolvedSchoolId!}
                    branchId={gate.resolvedBranchId!}
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