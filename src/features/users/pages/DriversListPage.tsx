
import React, { useState }       from "react";
import { useQuery }              from "@tanstack/react-query";
import { Phone, Plus, Users }           from "lucide-react";
import { useAuth }               from "@/features/auth/";
import { useTenantGate }         from "@/tenant/hooks/useTenantGate";
import { useDebounce, usePagination } from "@/core";
import { toast }                 from "sonner";
import {
    useEntityModal,
    useEntityMutation,
    EntityStatusConfirmModal,
    StatsGrid,
    SearchFilterBar,
    EmptyState,
    EntityModal,
} from "@/components";
import { TenantGate }            from "@/tenant";

import type {
    DriverCreateRequest,
    DriverResponse,
    DriverUpdateRequest
} from "../types";
import { DriverCard }           from "../components/DriverCard";
import { DriverForm }           from "../components/DriverForm";
import type { DriverFormData }  from "../components/DriverForm";
import {
    getDrivers,
} from "../api";
import { createDriver, deactivateDriver, updateDriver, reactivateDriver } from "../api/drivers.api";
// =============================================================================
// Types
// =============================================================================

type FilterStatus = "all" | "active" | "inactive";

const DriversListPage: React.FC = () => {
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

    const activeOnly: boolean | undefined =
        filterStatus === "active"   ? true  :
        filterStatus === "inactive" ? false :
        undefined;

    // ── Modals ────────────────────────────────────────────────────────────────
    const driverModal                           = useEntityModal<DriverResponse>();
    const [confirmDriver, setConfirmDriver]     = useState<DriverResponse | null>(null);

    // ── Drivers query ────────────────────────────────────────────────────────
    //
    // The backend requires BOTH school_id and branch_id as query params.
    // Non-null assertions are safe because the query is disabled until
    // gate.scopeReady is true, guaranteeing both ids are defined.
    const { data, isLoading } = useQuery({
        queryKey: [
            "drivers",
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
            getDrivers({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                //active_only: activeOnly,
                page,
                page_size  : pageSize,
            }),
        enabled  : gate.scopeReady,
        staleTime: 30_000,
    });
    const allDrivers   = data?.items ?? [];
    const total         = data?.total  ?? 0;
    const totalPages    = data?.pages  ?? 1;
    const activeCount   = allDrivers.filter((s: DriverResponse) =>  s.is_active).length;
    const inactiveCount = allDrivers.filter((s: DriverResponse) => !s.is_active).length;

    // Client-side search filter (backend list endpoint has no search param)
    const drivers = allDrivers.filter((d: DriverResponse) => {
        const fullName = [d.first_name, d.last_name].filter(Boolean).join(" ");
        const matchesSearch = debouncedSearch
            ? fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
              (d.license_number ?? "").toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !d.is_active :
            filterStatus === "active"   ?  d.is_active :
            true;
        return matchesSearch && matchesStatus;
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const {
        createMutation,
        updateMutation,
        toggleMutation,
        isLoading: isMutating,
    } = useEntityMutation<DriverResponse, DriverCreateRequest, DriverUpdateRequest>({
        entityName : "Driver",
        queryKey   : ["drivers"],
        createFn   : createDriver,
        /**
         * updateFn receives (id, data) — but our updateDriver API also needs
         * school_id + branch_id as query params. We wrap it here so the hook
         * stays generic.
         */
        updateFn   : (id, data) =>
            updateDriver(id, gate.resolvedSchoolId!, gate.resolvedBranchId!, data),
        /**
         * toggleFn (deactivate) also needs school_id + branch_id.
         */
        toggleFn   : (driver) =>
            driver.is_active
                ? deactivateDriver(
                    driver.driver_id,
                    {
                        school_id: gate.resolvedSchoolId!,
                        branch_id: gate.resolvedBranchId!
                    })
                : reactivateDriver(
                    driver.driver_id,
                    {school_id: gate.resolvedSchoolId!, branch_id: gate.resolvedBranchId!}),
        getEntityId: (d) => d.driver_id,
        onCreateSuccess: () => driverModal.close(),
        onUpdateSuccess: () => driverModal.close(),
        onToggleSuccess: () => setConfirmDriver(null),
    });

    /**
     * Unified create + edit handler.
     * On create: school_id + branch_id are injected from gate so DriverForm
     * stays completely tenant-agnostic.
     */
    const handleSubmit = async (formData: DriverFormData): Promise<void> => {
        if (driverModal.isEdit && driverModal.item) {
            await updateMutation.mutateAsync({
                entity: driverModal.item,
                data  : {
                    first_name      : formData.first_name,
                    last_name       : formData.last_name || null,
                    //admission_number: formData.admission_number || null,
                    phone           : formData.phone    || null,
                    license_number  : formData.license_number || null,
                    is_active       : formData.is_active,
                },
            });
        } else {
            await createMutation.mutateAsync({
                school_id       : gate.resolvedSchoolId!,
                branch_id       : gate.resolvedBranchId!,
                first_name      : formData.first_name,
                last_name       : formData.last_name       || null,
                phone           : formData.phone           || null,
                license_number  : formData.license_number  || null,
            });
        }
    };
    // ── Create guard ──────────────────────────────────────────────────────────
    const handleOpenCreate = (): void => {
        if (!gate.scopeReady) {
            toast.error("Please select a school and branch first.");
            return;
        }
        driverModal.openCreate();
    };

    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Drivers
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a School and Branch, then manage its Drivers."
                            : isSchoolAdmin
                                ? "Select a Branch to view and manage its Driver."
                                : "Manage Drivers for your branch."
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
                        Add Driver
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
                            ? "Pick a Branch above to view and manage its Drivers."
                            : "Pick a School first, then choose a branch."
                    }
                    variant="scope"
                />
            ) : (
                <>
                    {/* ── Stat pills ─────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: total,         label: "Total Drivers"             },
                            { value: activeCount,   label: "Active",   color: "green"   },
                            { value: inactiveCount, label: "Inactive", color: "slate"   },
                        ]}
                    />

                    {/* ── Search + filter ────────────────────────────────── */}
                    <SearchFilterBar
                        search={search}
                        placeholder="Search by name or license number…"
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
                    ) : drivers.length === 0 ? (
                        <EmptyState
                            emoji={debouncedSearch ? "🔍" : "🎓"}
                            title={
                                debouncedSearch
                                    ? `No results for "${debouncedSearch}"`
                                    : filterStatus !== "all"
                                        ? `No ${filterStatus} Drivers`
                                        : "No Drivers yet"
                            }
                            description={
                                debouncedSearch
                                    ? "Try a different name or license number."
                                    : filterStatus !== "all"
                                        ? `There are no drivers marked as inactive at this time.`
                                        : "Add the first Drivers for this branch."
                            }
                            action={
                                !debouncedSearch && filterStatus === "all" && canEdit
                                    ? {
                                        label  : "Add your first Driver",
                                        onClick: handleOpenCreate,
                                    }
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {drivers.map((driver) => (
                                <DriverCard
                                    key={driver.driver_id}
                                    driver={driver}
                                    showSchool={isSuperAdmin || isSchoolAdmin}
                                    canEdit={canEdit}
                                    onEdit={driverModal.openEdit}
                                    onToggle={setConfirmDriver}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Pagination ─────────────────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                            <p className="text-xs text-slate-400">
                                Page {page} of {totalPages} · {total} Drivers
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
                open={driverModal.open}
                mode={driverModal.mode}
                entityName="Driver"
                itemName={
                    driverModal.item
                        ? [
                            driverModal.item.first_name,
                            driverModal.item.last_name,
                            ]
                                .filter(Boolean)
                                .join(" ")
                        : undefined
                }
                onClose={driverModal.close}
                size="md"
                createSubtitle="Drivers must already have a platform user account"
            >
                <DriverForm
                    driver={driverModal.item ?? undefined}
                    onSubmit={handleSubmit}
                    onCancel={driverModal.close}
                    isLoading={isMutating}
                />
            </EntityModal>
            {/* ── Confirm status toggle ──────────────────────────────────────── */}
            <EntityStatusConfirmModal
                open={!!confirmDriver}
                entity={confirmDriver}
                entityName="Driver"
                entityLabel={
                    confirmDriver
                        ? [confirmDriver.first_name, confirmDriver.last_name]
                                .filter(Boolean)
                                .join(" ")
                        : ""
                }
                isLoading={toggleMutation.isPending}
                onConfirm={() =>
                    confirmDriver && toggleMutation.mutate(confirmDriver)
                }
                onCancel={() => setConfirmDriver(null)}
            />
        </div>
    );
};
export default DriversListPage;