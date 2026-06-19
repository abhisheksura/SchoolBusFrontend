// src/features/assignments/pages/AssignmentsPage.tsx
//
// Route:   /assignments
// Access:  SCHOOL_ADMIN, BRANCH_ADMIN (SUPER_ADMIN bypasses via RoleGuard)
//
// ── Design overview ───────────────────────────────────────────────────────────
//
//  The page has two view modes toggled by a tab bar:
//
//  ┌─────────────────────────────────────────────────┐
//  │  [ By Student ]  [ By Route ]    + Assign        │
//  ├─────────────────────────────────────────────────┤
//  │  BY STUDENT MODE                                 │
//  │  Student picker dropdown                         │
//  │  ─────────────────────────────────────────────  │
//  │  ▸ PICKUP  row                                   │
//  │  ▸ DROPOFF row                                   │
//  │  (each row shows route name + stop name)         │
//  ├─────────────────────────────────────────────────┤
//  │  BY ROUTE MODE                                   │
//  │  Route picker dropdown  +  PICKUP|DROPOFF tabs   │
//  │  ─────────────────────────────────────────────  │
//  │  Paginated table of assigned students + stops    │
//  └─────────────────────────────────────────────────┘
//
// Both views share the same "Assign Student" create modal and the same
// "Confirm remove" ConfirmModal. The tenant gate ensures school + branch
// are resolved before any query fires.
//
// ── Data strategy ─────────────────────────────────────────────────────────────
//
//  AssignmentResponse from the backend carries only IDs — no names.
//  We resolve display names client-side using three caches that are cheap
//  because they are already loaded by other pages:
//
//    student_id → student name  (from ["students", "dropdown", ...] cache)
//    route_id   → route name    (from ["routes",   "dropdown", ...] cache)
//    stop_id    → stop name     (from ["stops",    "dropdown-for-route", ...] cache)
//
//  This avoids N+1 fetches. If the cache is cold on first visit, we fire
//  three parallel queries and show skeletons until they resolve.

import React, { useState, useMemo } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
}                                    from "@tanstack/react-query";
import {
    Plus,
    Users,
    Route as RouteIcon,
    Loader2,
}                                    from "lucide-react";
import { toast }                     from "sonner";

import { useAuth }                   from "@/features/auth/";
import { useTenantGate }             from "@/tenant/hooks/useTenantGate";
import { usePagination }             from "@/core";
import {
    EmptyState,
    ConfirmModal,
    EntityModal,
    StatsGrid,
}                                    from "@/components";
import { TenantGate }                from "@/tenant";
import { getStudents }               from "@/features/users/api";
import { getRoutes }                 from "@/features/routes/api";
import { getStops }                  from "@/features/routes/api";

import {
    getStudentAssignments,
    getRouteAssignments,
    createAssignment,
    deactivateAssignment,
}                                    from "../api";
import { AssignmentRow }             from "../components/AssignmentRow";
import { AssignmentForm }            from "../components/AssignmentForm";
import type {
    AssignmentResponse,
    AssignmentType,
    AssignmentViewMode,
}                                    from "../types";

// =============================================================================
// View mode tab config
// =============================================================================

const VIEW_TABS: { id: AssignmentViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "by_student", label: "By Student", icon: <Users  size={14} strokeWidth={2} /> },
    { id: "by_route",   label: "By Route",   icon: <RouteIcon size={14} strokeWidth={2} /> },
];

// =============================================================================
// Page component
// =============================================================================

const AssignmentsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();

    // ── Role flags ────────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");
    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

    // ── Tenant gate ───────────────────────────────────────────────────────────
    const gate = useTenantGate();

    // ── View mode ─────────────────────────────────────────────────────────────
    const [viewMode, setViewMode]             = useState<AssignmentViewMode>("by_student");

    // ── By-student picker ─────────────────────────────────────────────────────
    const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);

    // ── By-route picker + type tab ────────────────────────────────────────────
    const [selectedRouteId,   setSelectedRouteId]   = useState<number | undefined>(undefined);
    const [routeTypeTab,      setRouteTypeTab]       = useState<AssignmentType>("PICKUP");

    // ── Pagination (by-route view only) ───────────────────────────────────────
    const { page, pageSize, setPage } = usePagination(20);

    // ── Modals ────────────────────────────────────────────────────────────────
    const [createModalOpen, setCreateModalOpen]   = useState(false);
    const [confirmRemove,   setConfirmRemove]     = useState<AssignmentResponse | null>(null);

    // ==========================================================================
    // Reference data — students, routes, stops (for name resolution)
    // ==========================================================================

    const { data: studentsData } = useQuery({
        queryKey : ["students", "dropdown", { schoolId: gate.resolvedSchoolId, branchId: gate.resolvedBranchId }],
        queryFn  : () =>
            getStudents({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: true,
                page_size  : 500,
            }),
        enabled  : gate.scopeReady,
        staleTime: 60_000,
    });

    const { data: routesData } = useQuery({
        queryKey : ["routes", "dropdown", { schoolId: gate.resolvedSchoolId, branchId: gate.resolvedBranchId }],
        queryFn  : () =>
            getRoutes({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: true,
                page_size  : 100,
            }),
        enabled  : gate.scopeReady,
        staleTime: 60_000,
    });

    const { data: stopsData } = useQuery({
        queryKey : ["stops", "dropdown-for-route", { schoolId: gate.resolvedSchoolId, branchId: gate.resolvedBranchId }],
        queryFn  : () =>
            getStops({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: true,
                page_size  : 100,
            }),
        enabled  : gate.scopeReady,
        staleTime: 60_000,
    });

    // ── Name resolution maps ──────────────────────────────────────────────────

    const studentNameMap = useMemo(
        () =>
            new Map(
                (studentsData?.items ?? []).map((s) => [
                    s.student_id,
                    [s.first_name, s.last_name].filter(Boolean).join(" "),
                ]),
            ),
        [studentsData],
    );

    const routeNameMap = useMemo(
        () =>
            new Map(
                (routesData?.items ?? []).map((r) => [
                    r.route_id,
                    `${r.route_code} — ${r.route_name}`,
                ]),
            ),
        [routesData],
    );

    const stopNameMap = useMemo(
        () =>
            new Map(
                (stopsData?.items ?? []).map((s) => [s.stop_id, s.stop_name]),
            ),
        [stopsData],
    );

    // ==========================================================================
    // By-student query
    // ==========================================================================

    const {
        data    : studentAssignments = [],
        isLoading: studentAssignmentsLoading,
    } = useQuery({
        queryKey: [
            "assignments",
            "by-student",
            selectedStudentId,
            {
                schoolId: gate.resolvedSchoolId,
                branchId: gate.resolvedBranchId,
            },
        ],
        queryFn: () =>
            getStudentAssignments(selectedStudentId!, {
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: false,   // show inactive too so admins can see history
            }),
        enabled  : viewMode === "by_student" && !!selectedStudentId && gate.scopeReady,
        staleTime: 30_000,
    });

    // Split by type for two-section display
    const pickupAssignments  = studentAssignments.filter((a) => a.assignment_type === "PICKUP");
    const dropoffAssignments = studentAssignments.filter((a) => a.assignment_type === "DROPOFF");

    // ==========================================================================
    // By-route query (paginated)
    // ==========================================================================

    const {
        data    : routeAssignmentsData,
        isLoading: routeAssignmentsLoading,
    } = useQuery({
        queryKey: [
            "assignments",
            "by-route",
            selectedRouteId,
            routeTypeTab,
            page,
            pageSize,
            {
                schoolId: gate.resolvedSchoolId,
                branchId: gate.resolvedBranchId,
            },
        ],
        queryFn: () =>
            getRouteAssignments(selectedRouteId!, {
                school_id      : gate.resolvedSchoolId!,
                branch_id      : gate.resolvedBranchId!,
                assignment_type: routeTypeTab,
                active_only    : false,
                page,
                page_size      : pageSize,
            }),
        enabled  : viewMode === "by_route" && !!selectedRouteId && gate.scopeReady,
        staleTime: 30_000,
    });

    const routeAssignments = routeAssignmentsData?.items ?? [];
    const routeTotal       = routeAssignmentsData?.total ?? 0;
    const routeTotalPages  = routeAssignmentsData?.pages ?? 1;

    // ==========================================================================
    // Mutations
    // ==========================================================================

    // ── Create ────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createAssignment,
        onSuccess : () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
            toast.success("Student assigned to route");
            setCreateModalOpen(false);
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to create assignment"),
    });

    // ── Deactivate ────────────────────────────────────────────────────────────
    const deactivateMutation = useMutation({
        mutationFn: (a: AssignmentResponse) =>
            deactivateAssignment(a.assignment_id, gate.resolvedSchoolId!, gate.resolvedBranchId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
            toast.success("Assignment removed");
            setConfirmRemove(null);
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to remove assignment"),
    });

    // ==========================================================================
    // Stats (from whichever data set is active)
    // ==========================================================================

    const activeStats = useMemo(() => {
        if (viewMode === "by_student") {
            const active   = studentAssignments.filter((a) => a.is_active).length;
            const inactive = studentAssignments.filter((a) => !a.is_active).length;
            return { total: studentAssignments.length, active, inactive };
        }
        return {
            total   : routeTotal,
            active  : routeAssignments.filter((a) => a.is_active).length,
            inactive: routeAssignments.filter((a) => !a.is_active).length,
        };
    }, [viewMode, studentAssignments, routeAssignments, routeTotal]);

    // ==========================================================================
    // Handlers
    // ==========================================================================

    const handleOpenCreate = (): void => {
        if (!gate.scopeReady) {
            toast.error("Select a school and branch first.");
            return;
        }
        setCreateModalOpen(true);
    };

    // Reset pagination when route or type tab changes
    const handleRouteChange = (routeId: number | undefined): void => {
        setSelectedRouteId(routeId);
        setPage(1);
    };

    const handleRouteTypeTabChange = (type: AssignmentType): void => {
        setRouteTypeTab(type);
        setPage(1);
    };

    // ==========================================================================
    // Shared SELECT style
    // ==========================================================================

    const SELECT =
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 " +
        "text-sm text-slate-800 outline-none transition-all " +
        "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-5">

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Assignments
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a school and branch to manage student route assignments."
                            : isSchoolAdmin
                                ? "Select a branch to manage student route assignments."
                                : "Manage student route assignments for your branch."
                        }
                    </p>
                </div>

                {canEdit && (
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        disabled={!gate.scopeReady}
                        title={!gate.scopeReady ? "Select a school and branch first" : undefined}
                        className={[
                            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                            "text-sm font-semibold text-white shadow-sm transition-colors",
                            gate.scopeReady
                                ? "bg-indigo-500 hover:bg-indigo-600"
                                : "cursor-not-allowed bg-slate-300",
                        ].join(" ")}
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Assign Student
                    </button>
                )}
            </div>

            {/* ── Tenant gate ──────────────────────────────────────────────── */}
            <TenantGate gate={gate} />

            {/* ── Scope prompt or page content ─────────────────────────────── */}
            {!gate.scopeReady ? (
                <EmptyState
                    icon={<Users size={24} className="text-indigo-400" />}
                    title={
                        gate.resolvedSchoolId
                            ? "Select a branch to continue"
                            : "Select a school to continue"
                    }
                    description="Pick a school and branch above to view and manage assignments."
                    variant="scope"
                />
            ) : (
                <>
                    {/* ── View mode tabs ───────────────────────────────────── */}
                    <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
                        {VIEW_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setViewMode(tab.id)}
                                className={[
                                    "flex flex-1 items-center justify-center gap-2",
                                    "rounded-xl px-4 py-2.5 text-sm transition-all duration-150",
                                    viewMode === tab.id
                                        ? "bg-indigo-500 font-semibold text-white shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                                ].join(" ")}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Stats ────────────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: activeStats.total,    label: "Total"                   },
                            { value: activeStats.active,   label: "Active",   color: "green" },
                            { value: activeStats.inactive, label: "Inactive", color: "slate" },
                        ]}
                    />

                    {/* ============================================================ */}
                    {/* BY STUDENT VIEW                                              */}
                    {/* ============================================================ */}
                    {viewMode === "by_student" && (
                        <div className="flex flex-col gap-4">

                            {/* Student selector */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Select Student
                                </label>
                                <select
                                    value={selectedStudentId ?? ""}
                                    onChange={(e) =>
                                        setSelectedStudentId(
                                            e.target.value ? Number(e.target.value) : undefined,
                                        )
                                    }
                                    className={SELECT}
                                >
                                    <option value="">— Choose a student —</option>
                                    {(studentsData?.items ?? []).map((s) => (
                                        <option key={s.student_id} value={s.student_id}>
                                            {[s.first_name, s.last_name].filter(Boolean).join(" ")}
                                            {s.admission_number ? ` (${s.admission_number})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignment rows */}
                            {!selectedStudentId ? (
                                <EmptyState
                                    emoji="🧑‍🎓"
                                    title="Select a student above"
                                    description="Pick a student to view their route assignments."
                                />
                            ) : studentAssignmentsLoading ? (
                                <div className="flex flex-col gap-2 animate-pulse">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="h-14 rounded-xl bg-slate-100" />
                                    ))}
                                </div>
                            ) : studentAssignments.length === 0 ? (
                                <EmptyState
                                    emoji="📋"
                                    title="No assignments yet"
                                    description="This student has not been assigned to any route."
                                    action={canEdit ? { label: "Assign now", onClick: handleOpenCreate } : undefined}
                                />
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {/* PICKUP section */}
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                                            Pick-up ({pickupAssignments.length})
                                        </p>
                                        {pickupAssignments.length === 0 ? (
                                            <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                                                No pick-up assignment
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {pickupAssignments.map((a) => (
                                                    <AssignmentRow
                                                        key={a.assignment_id}
                                                        assignment={a}
                                                        studentName={studentNameMap.get(a.student_id) ?? `Student #${a.student_id}`}
                                                        routeName={routeNameMap.get(a.route_id) ?? `Route #${a.route_id}`}
                                                        stopName={stopNameMap.get(a.stop_id) ?? `Stop #${a.stop_id}`}
                                                        viewMode="by_student"
                                                        canEdit={canEdit}
                                                        onRemove={setConfirmRemove}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* DROPOFF section */}
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                                            Drop-off ({dropoffAssignments.length})
                                        </p>
                                        {dropoffAssignments.length === 0 ? (
                                            <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                                                No drop-off assignment
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {dropoffAssignments.map((a) => (
                                                    <AssignmentRow
                                                        key={a.assignment_id}
                                                        assignment={a}
                                                        studentName={studentNameMap.get(a.student_id) ?? `Student #${a.student_id}`}
                                                        routeName={routeNameMap.get(a.route_id) ?? `Route #${a.route_id}`}
                                                        stopName={stopNameMap.get(a.stop_id) ?? `Stop #${a.stop_id}`}
                                                        viewMode="by_student"
                                                        canEdit={canEdit}
                                                        onRemove={setConfirmRemove}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* BY ROUTE VIEW                                                */}
                    {/* ============================================================ */}
                    {viewMode === "by_route" && (
                        <div className="flex flex-col gap-4">

                            {/* Route selector + type tab */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">

                                    {/* Route dropdown */}
                                    <div className="flex-1">
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Select Route
                                        </label>
                                        <select
                                            value={selectedRouteId ?? ""}
                                            onChange={(e) =>
                                                handleRouteChange(
                                                    e.target.value ? Number(e.target.value) : undefined,
                                                )
                                            }
                                            className={SELECT}
                                        >
                                            <option value="">— Choose a route —</option>
                                            {(routesData?.items ?? []).map((r) => (
                                                <option key={r.route_id} value={r.route_id}>
                                                    {r.route_code} — {r.route_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* PICKUP / DROPOFF tab toggle */}
                                    <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0">
                                        {(["PICKUP", "DROPOFF"] as const).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => handleRouteTypeTabChange(type)}
                                                className={[
                                                    "rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
                                                    routeTypeTab === type
                                                        ? type === "PICKUP"
                                                            ? "bg-blue-500 text-white shadow-sm"
                                                            : "bg-amber-500 text-white shadow-sm"
                                                        : "text-slate-400 hover:text-slate-600",
                                                ].join(" ")}
                                            >
                                                {type === "PICKUP" ? "Pick-up" : "Drop-off"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Assignment rows */}
                            {!selectedRouteId ? (
                                <EmptyState
                                    emoji="🗺️"
                                    title="Select a route above"
                                    description="Pick a route to view its assigned students."
                                />
                            ) : routeAssignmentsLoading ? (
                                <div className="flex flex-col gap-2 animate-pulse">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-14 rounded-xl bg-slate-100" />
                                    ))}
                                </div>
                            ) : routeAssignments.length === 0 ? (
                                <EmptyState
                                    emoji="📋"
                                    title={`No ${routeTypeTab === "PICKUP" ? "pick-up" : "drop-off"} assignments`}
                                    description="No students have been assigned to this route for the selected trip type."
                                    action={canEdit ? { label: "Assign a student", onClick: handleOpenCreate } : undefined}
                                />
                            ) : (
                                <>
                                    {/* Header row */}
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-xs text-slate-400">
                                            {routeTotal} student{routeTotal !== 1 ? "s" : ""} assigned
                                        </p>
                                    </div>

                                    {/* Rows */}
                                    <div className="flex flex-col gap-2">
                                        {routeAssignments.map((a) => (
                                            <AssignmentRow
                                                key={a.assignment_id}
                                                assignment={a}
                                                studentName={studentNameMap.get(a.student_id) ?? `Student #${a.student_id}`}
                                                routeName={routeNameMap.get(a.route_id) ?? `Route #${a.route_id}`}
                                                stopName={stopNameMap.get(a.stop_id) ?? `Stop #${a.stop_id}`}
                                                viewMode="by_route"
                                                canEdit={canEdit}
                                                onRemove={setConfirmRemove}
                                            />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {routeTotalPages > 1 && (
                                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                                            <p className="text-xs text-slate-400">
                                                Page {page} of {routeTotalPages} · {routeTotal} assignments
                                            </p>
                                            <div className="flex gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setPage(page - 1)}
                                                    disabled={page <= 1}
                                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPage(page + 1)}
                                                    disabled={page >= routeTotalPages}
                                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Assign Student modal ─────────────────────────────────────── */}
            {/*}
            <EntityModal
                open={createModalOpen}
                mode="create"
                entityName="Assignment"
                onClose={() => setCreateModalOpen(false)}
                size="md"
                createSubtitle="Assign a student to a route for pick-up or drop-off"
            >
                {gate.scopeReady && (
                    <AssignmentForm
                        schoolId={gate.resolvedSchoolId!}
                        branchId={gate.resolvedBranchId!}
                        // Pre-fill context based on current view mode
                        prefillStudentId={
                            viewMode === "by_student" ? selectedStudentId : undefined
                        }
                        prefillRouteId={
                            viewMode === "by_route" ? selectedRouteId : undefined
                        }
                        onSubmit={(payload) => createMutation.mutateAsync(payload)}
                        onCancel={() => setCreateModalOpen(false)}
                        isLoading={createMutation.isPending}
                    />
                )}
            </EntityModal>
            */}
            {/* ── Confirm remove ───────────────────────────────────────────── */}
            <ConfirmModal
                open={!!confirmRemove}
                title="Remove Assignment"
                message={
                    confirmRemove
                        ? `Remove this ${
                              confirmRemove.assignment_type === "PICKUP" ? "pick-up" : "drop-off"
                          } assignment? The student will no longer be included in this route's ${
                              confirmRemove.assignment_type === "PICKUP" ? "pick-up" : "drop-off"
                          } trips.`
                        : ""
                }
                confirmLabel="Remove"
                danger
                isLoading={deactivateMutation.isPending}
                onConfirm={() =>
                    confirmRemove && deactivateMutation.mutate(confirmRemove)
                }
                onCancel={() => setConfirmRemove(null)}
            />
        </div>
    );
};

export default AssignmentsPage;