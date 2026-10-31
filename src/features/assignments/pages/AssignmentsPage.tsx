
import React, { useState }       from "react";
import { useAuth }               from "@/features/auth/";
import { useQuery }              from "@tanstack/react-query";
import { useTenantGate }         from "@/tenant/hooks/useTenantGate";
import { Plus, Users }           from "lucide-react";
import { toast }                 from "sonner";

import { TenantGate }            from "@/tenant";
import { getRoutes, getRouteWithStops }             from "@/features/routes/api";
import { getStudents }           from "@/features/users/api";
import { StudentCard }           from "@/features/users/components/StudentCard";
import { useDebounce, usePagination } from "@/core";

import {
    getStudentAssignments,
    getRouteAssignments,
    createAssignment,
    updateAssignment,
    deactivateAssignment,
    reactivateAssignment
}                                    from "../api";
import {
    useEntityModal,
    useEntityMutation,
    EntityStatusConfirmModal,
    StatsGrid,
    SearchFilterBar,
    EmptyState,
    EntityModal,
} from "@/components";
import type {
    AssignmentType,
    AssignmentResponse,
    AssignmentCreateRequest,
    AssignmentUpdateRequest
} from "../types";
import { AssignmentRow } from "../components/AssignmentRow";
import { AssignmentForm, type AssignmentFormData } from "../components/AssignmentForm";

type FilterStatus = "all" | "active" | "inactive";

const AssignmentsPage: React.FC = () => {

    const { hasRole } = useAuth();

    // ── Role flags ────────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");
    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

    const gate = useTenantGate();

    // ── Search / filter / pagination ──────────────────────────────────────────
    const [search,       setSearch]       = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const debouncedSearch                 = useDebounce(search, 400);

    const [selectedRouteId,   setSelectedRouteId]   = useState<number | undefined>(undefined);
    const [routeTypeTab,      setRouteTypeTab]      = useState<AssignmentType>("PICKUP");

    const { page, pageSize, setPage, setPageSize } = usePagination(15);

    const activeOnly: boolean | undefined =
        filterStatus === "active"   ? true  :
        filterStatus === "inactive" ? false :
        undefined;

    // ── Modals ────────────────────────────────────────────────────────────────
    const assignmentModal                           = useEntityModal<AssignmentResponse>();
    const [confirmAssignment, setConfirmAssignment] = useState<AssignmentResponse | null>(null);

    const { data: routesData } = useQuery({
        queryKey : ["routes", "dropdown", { schoolId: gate.resolvedSchoolId, branchId: gate.resolvedBranchId, activeOnly, pageSize }],
        queryFn  : () =>
            getRoutes({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: activeOnly,
                page_size  : pageSize,
            }),
        enabled  : gate.scopeReady,
        staleTime: 60_000,
    });

    const { data, isLoading } = useQuery({
        queryKey: [
            "assignments",
            {
                school_id    : gate.resolvedSchoolId,
                branch_id    : gate.resolvedBranchId,
                route_id     : selectedRouteId,
                assignment_type: routeTypeTab,
                page,
                pageSize,
                filterStatus,
                debouncedSearch,
                active_only: activeOnly,
            },
        ],
        queryFn: () =>
            getRouteAssignments(selectedRouteId!, {
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                assignment_type: routeTypeTab,
                active_only: activeOnly,
                page,
                page_size  : pageSize,
            }),
        enabled  : !!selectedRouteId && gate.scopeReady,
        staleTime: 30_000,
    });

    // ── Assignment form dropdown data (scoped to school + branch) ─────────────
    // The form is tenant-agnostic, so the page loads everything it renders.
    // Queries only run while the modal is open.
    const [formRouteId, setFormRouteId] = useState<number | undefined>(undefined);

    const { data: formStudentsData, isLoading: formStudentsLoading } = useQuery({
        queryKey : ["students", "dropdown", { schoolId: gate.resolvedSchoolId, branchId: gate.resolvedBranchId }],
        queryFn  : () =>
            getStudents({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: true,
            }),
        enabled  : assignmentModal.open && gate.scopeReady,
        staleTime: 60_000,
    });

    const { data: formRoutesData, isLoading: formRoutesLoading } = useQuery({
        queryKey : ["routes", "dropdown", "form", { schoolId: gate.resolvedSchoolId, branchId: gate.resolvedBranchId }],
        queryFn  : () =>
            getRoutes({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: true,
                //page_size  : 200,
            }),
        enabled  : assignmentModal.open && gate.scopeReady,
        staleTime: 60_000,
    });

    const { data: formStopsData, isLoading: formStopsLoading } = useQuery({
        queryKey : ["route-stops", formRouteId, { schoolId: gate.resolvedSchoolId, branchId: gate.resolvedBranchId }],
        queryFn  : () =>
            getRouteWithStops(formRouteId!, gate.resolvedSchoolId!, gate.resolvedBranchId!),
        enabled  : assignmentModal.open && gate.scopeReady && formRouteId !== undefined,
        staleTime: 60_000,
    });

    const allStudents   = data?.items ?? [];
    const total         = data?.total  ?? 0;
    const totalPages    = data?.pages  ?? 1;
    const activeCount   = allStudents.filter((b: AssignmentResponse) =>  b.is_active).length;
    const inactiveCount = allStudents.filter((b: AssignmentResponse) => !b.is_active).length;

    //const [confirmRemove,   setConfirmRemove]     = useState<AssignmentResponse | null>(null);

    // Client-side search filter (backend list endpoint has no search param)

    const students = allStudents.filter((a: AssignmentResponse) => {
        const matchesSearch = debouncedSearch
            ? `${a.student?.first_name ?? ""} ${a.student?.last_name ?? ""}`
                .toLowerCase()
                .includes(debouncedSearch.toLowerCase()) ||
            a.stop_name.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;

        const matchesStatus =
            filterStatus === "inactive" ? !a.is_active :
            filterStatus === "active"   ?  a.is_active :
            true;

        return matchesSearch && matchesStatus;
    });
    // ── Mutations ─────────────────────────────────────────────────────────────
    const {
        createMutation,
        updateMutation,
        toggleMutation,
        isLoading: isMutating,
    } = useEntityMutation<AssignmentResponse, AssignmentCreateRequest, AssignmentUpdateRequest>({
        entityName : "Assignment",
        queryKey   : ["assignments"],
        createFn   : createAssignment,
        /**
         * updateFn receives (id, data) — but our updateStop API also needs
         * school_id + branch_id as query params. We wrap it here so the hook
         * stays generic.
         */
        updateFn   : (id, data) =>
            updateAssignment(id, gate.resolvedSchoolId!, gate.resolvedBranchId!, data),
        /**
         * toggleFn (deactivate) also needs school_id + branch_id.
         */
        toggleFn   : (assignment) =>
            assignment.is_active
                ? deactivateAssignment(
                    assignment.assignment_id,
                    {
                        school_id: gate.resolvedSchoolId!,
                        branch_id: gate.resolvedBranchId!
                    })
                : reactivateAssignment(
                    assignment.assignment_id,
                    {school_id: gate.resolvedSchoolId!, branch_id: gate.resolvedBranchId!}),
        getEntityId: (a) => a.assignment_id,

        // Assignments have no display name — leave it blank in toast messages.
        getEntityName  : () => "",
        onCreateSuccess: () => assignmentModal.close(),
        onUpdateSuccess: () => assignmentModal.close(),
        onToggleSuccess: () => setConfirmAssignment(null),
    });

    /**
     * Unified create + edit handler.
     * On create: school_id + branch_id are injected from gate so RouteForm
     * stays completely tenant-agnostic.
     */
    const handleSubmit = async (formData: AssignmentFormData): Promise<void> => {
        if (assignmentModal.isEdit && assignmentModal.item) {
            await updateMutation.mutateAsync({
                entity: assignmentModal.item,
                data  : {
                    student_id      : formData.student_id,
                    route_id        : formData.route_id,
                    stop_id         : formData.stop_id,
                    assignment_type : formData.assignment_type
                },
            });
        } else {
            await createMutation.mutateAsync({
                school_id       : gate.resolvedSchoolId!,
                branch_id       : gate.resolvedBranchId!,
                student_id      : formData.student_id,
                route_id        : formData.route_id,
                stop_id         : formData.stop_id,
                assignment_type : formData.assignment_type
            });
        }
    };

    // ── Create guard ──────────────────────────────────────────────────────────
    const handleOpenCreate = (): void => {
        if (!gate.scopeReady) {
            toast.error("Please select a school and branch first.");
            return;
        }
        assignmentModal.openCreate();
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

    const handleConfirmAssignment = async (): Promise<void> => {
        if (!confirmAssignment) return;

        await toggleMutation.mutateAsync(confirmAssignment);
    };

    // ==========================================================================
    // Shared SELECT style
    // ==========================================================================

    const SELECT =
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 " +
        "text-sm text-slate-800 outline-none transition-all " +
        "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";

    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Assignments
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a School and Branch, then manage its Assignments."
                            : isSchoolAdmin
                                ? "Select a Branch to view and manage its Assignments."
                                : "Manage Assignments for your branch."
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
                        Add Assignments
                    </button>
                )}
            </div>

            {/* ── Tenant gate ───────────────────────────────────────────────── */}
            <TenantGate gate={gate} />

            {/* ── Scope prompt or page content ─────────────────────────────── */}
            {!gate.scopeReady ? (
                <EmptyState
                    icon={<Users size={24} className="text-blue-400" />}
                    title={
                        gate.resolvedSchoolId
                            ? "Select a Branch to continue"
                            : "Select a School to continue"
                    }
                    description={
                        gate.resolvedSchoolId
                            ? "Pick a Branch above to view and manage its Assignments."
                            : "Pick a School first, then choose a Branch."
                    }
                    variant="scope"
                />
            ) : (
                <>
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
                    </div>
                    {/* ── Stat pills ─────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: total,         label: "Total Students"             },
                            { value: activeCount,   label: "Active",   color: "green"   },
                            { value: inactiveCount, label: "Inactive", color: "slate"   },
                        ]}
                    />
                    {/* ── Search + filter ────────────────────────────────── */}
                    <SearchFilterBar
                        search={search}
                        placeholder="Search by Student or Stop"
                        onSearchChange={(val) => { setSearch(val); setPage(1); }}
                        filters={[
                            { label: "All",      value: "all"      },
                            { label: "Active",   value: "active"   },
                            { label: "Inactive", value: "inactive" },
                        ]}
                        activeFilter={filterStatus}
                        onFilterChange={(val) => {
                            setFilterStatus(val as FilterStatus);
                            setPage(1);
                        }}
                    />

                    {/* ── Cards ──────────────────────────────────────────── */}

                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-56 animate-pulse rounded-2xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : students.length === 0 ? (
                        <EmptyState
                            emoji={debouncedSearch ? "🔍" : "🎓"}
                            title={
                                debouncedSearch
                                    ? `No results for "${debouncedSearch}"`
                                    : filterStatus !== "all"
                                        ? `No ${filterStatus} students`
                                        : "No students yet"
                            }
                            description={
                                debouncedSearch
                                    ? "Try a different search term or clear the filter"
                                    : filterStatus !== "all"
                                        ? `There are no students marked as inactive at this time.`
                                        : "Add the first students for this branch."
                            }
                            action={
                                !debouncedSearch && filterStatus === "all" && canEdit
                                    ? {
                                        label  : "Add your first student",
                                        onClick: handleOpenCreate,
                                    }
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="flex flex-col gap-2">
                        {/*</div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">*/}
                            {students.map((student) => (
                                <div key={student.assignment_id}>
                                    <AssignmentRow
                                        assignment={student}
                                        routeName={student.route_name}
                                        stopName={student.stop_name}
                                        viewMode="by_route"
                                        canEdit={canEdit}
                                        onEdit={assignmentModal.openEdit}
                                        onRemove={setConfirmAssignment}
                                        onActivate={setConfirmAssignment}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Pagination ─────────────────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                            <p className="text-xs text-slate-400">
                                Page {page} of {totalPages} · {total} routes
                            </p>
                            <div className="flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page <= 1}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= totalPages}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
            {/* ── Create / Edit modal ────────────────────────────────────────── */}
            <EntityModal
                open={assignmentModal.open}
                mode={assignmentModal.mode}
                entityName="Assignment"
                itemName={
                    assignmentModal.item
                        ? assignmentModal.item.assignment_id
                        : undefined
                }
                onClose={assignmentModal.close}
                size="md"
                createSubtitle="Assign a student to a route and boarding stop"
            >
                <AssignmentForm
                    assignment={assignmentModal.item ?? undefined}
                    students={formStudentsData?.items ?? []}
                    routes={formRoutesData?.items ?? []}
                    stops={formStopsData ?? []}
                    studentsLoading={formStudentsLoading}
                    routesLoading={formRoutesLoading}
                    stopsLoading={formStopsLoading && formRouteId !== undefined}
                    onRouteChange={setFormRouteId}
                    onSubmit={handleSubmit}
                    onCancel={assignmentModal.close}
                    isLoading={isMutating}
                />
            </EntityModal>
            {/* ── Confirm status toggle ──────────────────────────────────────── */}
            <EntityStatusConfirmModal
                open={!!confirmAssignment}
                entity={confirmAssignment}
                entityName="Assignment"
                entityLabel={
                    confirmAssignment
                    ? `${confirmAssignment.student?.first_name ?? ""} ${confirmAssignment.student?.last_name ?? ""}`.trim()
                    : ""
                }
                isLoading={toggleMutation.isPending}
                onConfirm={() =>
                    confirmAssignment && toggleMutation.mutate(confirmAssignment)
                }
                onCancel={() => setConfirmAssignment(null)}
            />
        </div>
    );
};
export default AssignmentsPage;