
import React, { useState }       from "react";
import { Phone, Plus, Users }    from "lucide-react";
import { useAuth }               from "@/features/auth/";
import { useQuery }              from "@tanstack/react-query";
import { useDebounce, usePagination } from "@/core";

import { TenantGate }            from "@/tenant";
import {
    useEntityModal,
    useEntityMutation,
    EntityStatusConfirmModal,
    StatsGrid,
    SearchFilterBar,
    EmptyState,
    EntityModal,
} from "@/components";
import { useTenantGate }         from "@/tenant/hooks/useTenantGate";
import { toast }                 from "sonner";
import {
    createStop,
    updateStop,
    getStops,
    deactivateStop,
    reactivateStop
} from "../api";
import type {
    StopResponse,
    StopCreateRequest,
    StopUpdateRequest
} from "../types";
import { StopCard }           from "../components/StopCard";
import { StopForm }           from "../components/StopForm";
import type { StopFormData }  from "../components/StopForm";

type FilterStatus = "all" | "active" | "inactive";

const StopsListPage: React.FC = () => {
    const { hasRole } = useAuth();

    // ── Role flags ────────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");
    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

    // ── Tenant gate ───────────────────────────────────────────────────────────
    // gate.resolvedSchoolId + gate.resolvedBranchId are the authoritative
    // tenant ids used by every query and mutation on this page.
    const gate = useTenantGate();

    // ── Search / filter / pagination ──────────────────────────────────────────
    const [search,       setSearch]       = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const debouncedSearch                 = useDebounce(search, 400);
    const { page, pageSize, setPage, setPageSize } = usePagination(15);

    // ── Modals ────────────────────────────────────────────────────────────────
    const stopModal                            = useEntityModal<StopResponse>();
    const [confirmStop, setConfirmStop]        = useState<StopResponse | null>(null);

        // ── Drivers query ────────────────────────────────────────────────────────
    //
    // The backend requires BOTH school_id and branch_id as query params.
    // Non-null assertions are safe because the query is disabled until
    // gate.scopeReady is true, guaranteeing both ids are defined.
    const { data, isLoading } = useQuery({
        queryKey: [
            "stops",
            {
                school_id    : gate.resolvedSchoolId,
                branch_id    : gate.resolvedBranchId,
                page,
                pageSize,
                filterStatus,
                debouncedSearch,
            },
        ],
        queryFn: () =>
            getStops({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                //active_only: activeOnly,
                page,
                page_size  : pageSize,
            }),
        enabled  : gate.scopeReady,
        staleTime: 30_000,
    });
    const allStops      = data?.items ?? [];
    const total         = data?.total  ?? 0;
    const totalPages    = data?.pages  ?? 1;
    const activeCount   = allStops.filter((s: StopResponse) =>  s.is_active).length;
    const inactiveCount = allStops.filter((s: StopResponse) => !s.is_active).length;

    // Client-side search filter (backend list endpoint has no search param)
    const stops = allStops.filter((s: StopResponse) => {
        const stopName = s.stop_name ?? "";
        const matchesSearch = debouncedSearch
            ? stopName.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !s.is_active :
            filterStatus === "active"   ?  s.is_active :
            true;
        return matchesSearch && matchesStatus;
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const {
        createMutation,
        updateMutation,
        toggleMutation,
        isLoading: isMutating,
    } = useEntityMutation<StopResponse, StopCreateRequest, StopUpdateRequest>({
        entityName : "Stop",
        queryKey   : ["stops"],
        createFn   : createStop,
        /**
         * updateFn receives (id, data) — but our updateStop API also needs
         * school_id + branch_id as query params. We wrap it here so the hook
         * stays generic.
         */
        updateFn   : (id, data) =>
            updateStop(id, gate.resolvedSchoolId!, gate.resolvedBranchId!, data),
        /**
         * toggleFn (deactivate) also needs school_id + branch_id.
         */
        toggleFn   : (stop) =>
            stop.is_active
                ? deactivateStop(
                    stop.stop_id,
                    {
                        school_id: gate.resolvedSchoolId!,
                        branch_id: gate.resolvedBranchId!
                    })
                : reactivateStop(
                    stop.stop_id,
                    {school_id: gate.resolvedSchoolId!, branch_id: gate.resolvedBranchId!}),
        getEntityId: (s) => s.stop_id,
        getEntityName  : (s)=> s.stop_name,
        onCreateSuccess: () => stopModal.close(),
        onUpdateSuccess: () => stopModal.close(),
        onToggleSuccess: () => setConfirmStop(null),
    });

    /**
     * Unified create + edit handler.
     * On create: school_id + branch_id are injected from gate so StopForm
     * stays completely tenant-agnostic.
     */
    const handleSubmit = async (formData: StopFormData): Promise<void> => {
        if (stopModal.isEdit && stopModal.item) {
            await updateMutation.mutateAsync({
                entity: stopModal.item,
                data  : {
                    stop_name       : formData.stop_name,
                    latitude        : formData.latitude,
                    longitude       : formData.longitude,
                    is_active       : formData.is_active,
                },
            });
        } else {
            await createMutation.mutateAsync({
                school_id       : gate.resolvedSchoolId!,
                branch_id       : gate.resolvedBranchId!,
                stop_name       : formData.stop_name,
                latitude        : formData.latitude,
                longitude       : formData.longitude,
            });
        }
    };
    const handleOpenCreate = (): void => {
        if (!gate.scopeReady) {
            toast.error("Please select a school and branch first.");
            return;
        }
        stopModal.openCreate();
    };
    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Stops
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a School and Branch, then manage its Stops."
                            : isSchoolAdmin
                                ? "Select a Branch to view and manage its Stop."
                                : "Manage Stops for your branch."
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
                        Add Stop
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
                            ? "Pick a Branch above to view and manage its Stops."
                            : "Pick a School first, then choose a Branch."
                    }
                    variant="scope"
                />
            ) : (
                <>
                {/* ── Stat pills ─────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: total,         label: "Total Stops"             },
                            { value: activeCount,   label: "Active",   color: "green"   },
                            { value: inactiveCount, label: "Inactive", color: "slate"   },
                        ]}
                    />

                    {/* ── Search + filter ────────────────────────────────── */}
                    <SearchFilterBar
                        search={search}
                        placeholder="Search by StopName…"
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
                    ) : stops.length === 0 ? (
                        <EmptyState
                            emoji={debouncedSearch ? "🔍" : "🎓"}
                            title={
                                debouncedSearch
                                    ? `No results for "${debouncedSearch}"`
                                    : filterStatus !== "all"
                                        ? `No ${filterStatus} Stops`
                                        : "No Stops yet"
                            }
                            description={
                                debouncedSearch
                                    ? "Try a different name or license number."
                                    : filterStatus !== "all"
                                        ? `There are no stops marked as inactive at this time.`
                                        : "Add the first Stop for this branch."
                            }
                            action={
                                !debouncedSearch && filterStatus === "all" && canEdit
                                    ? {
                                        label  : "Add your first Stop ",
                                        onClick: handleOpenCreate,
                                    }
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {stops.map((stop) => (
                                <StopCard
                                    key={stop.stop_id}
                                    stop={stop}
                                    showSchool={isSuperAdmin || isSchoolAdmin}
                                    canEdit={canEdit}
                                    onEdit={stopModal.openEdit}
                                    onToggle={setConfirmStop}
                                />
                            ))}
                        </div>
                    )}
                    {/* ── Pagination ─────────────────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                            <p className="text-xs text-slate-400">
                                Page {page} of {totalPages} · {total} Stops
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
                open={stopModal.open}
                mode={stopModal.mode}
                entityName="Stop"
                itemName={
                    stopModal.item
                        ? stopModal.item.stop_name
                        : undefined
                }
                onClose={stopModal.close}
                size="md"
                createSubtitle="Stops must be aligned to the Routes"
            >
                <StopForm
                    stop={stopModal.item ?? undefined}
                    onSubmit={handleSubmit}
                    onCancel={stopModal.close}
                    isLoading={isMutating}
                />
            </EntityModal>

            {/* ── Confirm status toggle ──────────────────────────────────────── */}
            <EntityStatusConfirmModal
                open={!!confirmStop}
                entity={confirmStop}
                entityName="Stop"
                entityLabel={
                    confirmStop
                        ? confirmStop.stop_name
                        : ""
                }
                isLoading={toggleMutation.isPending}
                onConfirm={() =>
                    confirmStop && toggleMutation.mutate(confirmStop)
                }
                onCancel={() => setConfirmStop(null)}
            />
        </div>
    );
}
export default StopsListPage;