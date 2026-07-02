

import React, { useState }       from "react";
import { useQuery }              from "@tanstack/react-query";
import { Plus, Users }           from "lucide-react";
import { toast }                 from "sonner";

import { useAuth }               from "@/features/auth/";
import { useTenantGate }         from "@/tenant/hooks/useTenantGate";

import { useDebounce, usePagination } from "@/core";
import {
    useEntityModal,
    useEntityMutation,
    EntityStatusConfirmModal,
    StatsGrid,
    SearchFilterBar,
    EmptyState,
    EntityModal,
} from "@/components";
import {
    getBuses,
    createBus,
    updateBus,
    deactivateBus,
    reactivateBus
} from "../api";
import { TenantGate }            from "@/tenant";

import type {
    BusResponse,
    BusCreateRequest,
    BusUpdateRequest,
} from "../types";
import { BusCard }           from "../components/BusCard";
import { BusForm }           from "../components/BusForm";
import type { BusFormData }  from "../components/BusForm";

type FilterStatus = "all" | "active" | "inactive";

const BusesListPage: React.FC = () => {

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
    const { page, pageSize, setPage, setPageSize } = usePagination(15);

    const activeOnly: boolean | undefined =
        filterStatus === "active"   ? true  :
        filterStatus === "inactive" ? false :
        undefined;

    // ── Modals ────────────────────────────────────────────────────────────────
    const busModal                        = useEntityModal<BusResponse>();
    const [confirmBus, setConfirmBus]     = useState<BusResponse | null>(null);

    // ── Buses query ────────────────────────────────────────────────────────
    //
    // The backend requires BOTH school_id and branch_id as query params.
    // Non-null assertions are safe because the query is disabled until
    // gate.scopeReady is true, guaranteeing both ids are defined.
    const { data, isLoading } = useQuery({
        queryKey: [
            "buses",
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
            getBuses({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: activeOnly,
                page,
                page_size  : pageSize,
            }),
        enabled  : gate.scopeReady,
        staleTime: 30_000,
    });

    const allBuses      = data?.items ?? [];
    const total         = data?.total  ?? 0;
    const totalPages    = data?.pages  ?? 1;
    const activeCount   = allBuses.filter((b: BusResponse) =>  b.is_active).length;
    const inactiveCount = allBuses.filter((b: BusResponse) => !b.is_active).length;

    // Client-side search filter (backend list endpoint has no search param)
    const buses = allBuses.filter((b: BusResponse) => {
        const matchesSearch = debouncedSearch
            ? b.bus_number.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !b.is_active :
            filterStatus === "active"   ?  b.is_active :
            true;
        return matchesSearch && matchesStatus;
    });


    // ── Mutations ─────────────────────────────────────────────────────────────
    const {
        createMutation,
        updateMutation,
        toggleMutation,
        isLoading: isMutating,
    } = useEntityMutation<BusResponse, BusCreateRequest, BusUpdateRequest>({
        entityName : "Bus",
        queryKey   : ["buses"],
        createFn   : createBus,
        /**
         * updateFn receives (id, data) — but our updateRoute API also needs
         * school_id + branch_id as query params. We wrap it here so the hook
         * stays generic.
         */
        updateFn   : (id, data) =>
            updateBus(id, gate.resolvedSchoolId!, gate.resolvedBranchId!, data),
        /**
         * toggleFn (deactivate) also needs school_id + branch_id.
         */
        toggleFn   : (bus) =>
            bus.is_active
                ? deactivateBus(
                    bus.bus_id,
                    {
                        school_id: gate.resolvedSchoolId!,
                        branch_id: gate.resolvedBranchId!
                    })
                : reactivateBus(
                    bus.bus_id,
                    {school_id: gate.resolvedSchoolId!, branch_id: gate.resolvedBranchId!}),
        getEntityId: (b) => b.bus_id,
        getEntityName  : (b)=> b.bus_number,
        onCreateSuccess: () => busModal.close(),
        onUpdateSuccess: () => busModal.close(),
        onToggleSuccess: () => setConfirmBus(null),
    });

    // ── Submit handler ────────────────────────────────────────────────────────

    /**
     * Unified create + edit handler.
     * On create: school_id + branch_id are injected from gate so RouteForm
     * stays completely tenant-agnostic.
     */
    const handleSubmit = async (formData: BusFormData): Promise<void> => {
        if (busModal.isEdit && busModal.item) {
            await updateMutation.mutateAsync({
                entity: busModal.item,
                data  : {
                    bus_number      : formData.bus_number,
                    capacity        : formData.capacity,
                    is_active       : formData.is_active,
                },
            });
        } else {
            await createMutation.mutateAsync({
                school_id       : gate.resolvedSchoolId!,
                branch_id       : gate.resolvedBranchId!,
                bus_number      : formData.bus_number,
                capacity        : formData.capacity
            });
        }
    };

    // ── Create guard ──────────────────────────────────────────────────────────
    const handleOpenCreate = (): void => {
        if (!gate.scopeReady) {
            toast.error("Please select a school and branch first.");
            return;
        }
        busModal.openCreate();
    };
    return(
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Buses
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a School and Branch, then manage its Buses."
                            : isSchoolAdmin
                                ? "Select a Branch to view and manage its Bus."
                                : "Manage Buses for your branch."
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
                        Add Bus
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
                            ? "Pick a Branch above to view and manage its Buses."
                            : "Pick a School first, then choose a Branch."
                    }
                    variant="scope"
                />
            ) : (
                <>
                    {/* ── Stat pills ─────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: total,         label: "Total Buses"             },
                            { value: activeCount,   label: "Active",   color: "green"   },
                            { value: inactiveCount, label: "Inactive", color: "slate"   },
                        ]}
                    />

                    {/* ── Search + filter ────────────────────────────────── */}
                    <SearchFilterBar
                        search={search}
                        placeholder="Search by Bus Number"
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
                    ) : buses.length === 0 ? (
                        <EmptyState
                            emoji={debouncedSearch ? "🔍" : "🎓"}
                            title={
                                debouncedSearch
                                    ? `No results for "${debouncedSearch}"`
                                    : filterStatus !== "all"
                                        ? `No ${filterStatus} buses`
                                        : "No buses yet"
                            }
                            description={
                                debouncedSearch
                                    ? "Try a different search term or clear the filter"
                                    : filterStatus !== "all"
                                        ? `There are no buses marked as inactive at this time.`
                                        : "Add the first bus for this branch."
                            }
                            action={
                                !debouncedSearch && filterStatus === "all" && canEdit
                                    ? {
                                        label  : "Add your first bus",
                                        onClick: handleOpenCreate,
                                    }
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {buses.map((bus) => (
                                <BusCard
                                    key={bus.bus_id}
                                    bus={bus}
                                    showSchool={isSuperAdmin || isSchoolAdmin}
                                    canEdit={canEdit}
                                    onEdit={busModal.openEdit}
                                    onToggle={setConfirmBus}
                                />
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
                open={busModal.open}
                mode={busModal.mode}
                entityName="Bus"
                itemName={
                    busModal.item
                        ? busModal.item.bus_number
                        : undefined
                }
                onClose={busModal.close}
                size="md"
                createSubtitle="Enter a unique route code and a descriptive name"
            >
                <BusForm
                    bus={busModal.item ?? undefined}
                    onSubmit={handleSubmit}
                    onCancel={busModal.close}
                    isLoading={isMutating}
                />
            </EntityModal>
            {/* ── Confirm status toggle ──────────────────────────────────────── */}
            <EntityStatusConfirmModal
                open={!!confirmBus}
                entity={confirmBus}
                entityName="Bus"
                entityLabel={
                    confirmBus
                        ? confirmBus.bus_number
                        : ""
                }
                isLoading={toggleMutation.isPending}
                onConfirm={() =>
                    confirmBus && toggleMutation.mutate(confirmBus)
                }
                onCancel={() => setConfirmBus(null)}
            />
        </div>
    );
};

export default BusesListPage;