// src/modules/routes/pages/StopsListPage.tsx

import React, { useState } from "react";
import { useAuth }        from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

import { Plus } from "lucide-react";
import { EntityModal, StatsGrid, SearchFilterBar } from "@/components";
import { useEntityModal, useEntityMutation, EntityStatusConfirmModal } from "@/components/entity";
import { useDebounce, usePagination } from "@/core/";
import type {
    StopResponse,
    StopCreateRequest,
    StopUpdateRequest,
} from "../types";
import { StopCard } from "../components/StopCard";
import { StopForm } from "../components/StopForm";
import {
    getStops,
    createStop,
    updateStop,
    deactivateStop,
} from "../api";
import { useTenantScope } from "@/tenant/hooks/useTenantScope";

type FilterStatus = "all" | "active" | "inactive";


const StopsListPage: React.FC = () => {
    const { getSchoolIds, getBranchIds, hasRole } = useAuth();

    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");

    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

    // ── Pagination + search + filter ────────────────────────────────────
 
    const { page, pageSize, setPage } = usePagination(15);
    const [search,       setSearch]       = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const debouncedSearch = useDebounce(search, 400);


    const activeOnly = filterStatus === "active" ? true : false;

    // ── Tenant scope from JWT ────────────────────────────────────────────
    // SUPER_ADMIN  → schoolId = undefined, branchId = undefined
    // SCHOOL_ADMIN → schoolId = set, branchId may be undefined (multi-branch)
    // BRANCH_ADMIN → schoolId = set, branchId = set (single branch)

    const schoolIds = getSchoolIds();
    const schoolId  = schoolIds[0] as number | undefined;
    const branchIds = schoolId ? getBranchIds(schoolId) : [];
    const branchId  = branchIds[0] as number | undefined;
    
    // ── Reactive school selection for branch fetching ────────────────────
    // Tracks which school the user selected in the form so we can
    // reactively fetch that school's branches for the branch selector.
    // Pre-filled for SCHOOL_ADMIN (their school is already known).

    const [formSchoolId, setFormSchoolId] = useState<number | undefined>();

    // ── Modals ───────────────────────────────────────────────────────────
    const stopModal     = useEntityModal<StopResponse>();
    const [confirmStop, setConfirmStop] = useState<StopResponse | null>(null);

    // ── Stops query ──────────────────────────────────────────────────────
 
    const { data, isLoading } = useQuery({
        queryKey: ["stops", { page, pageSize, filterStatus }],
        queryFn:  () =>
            getStops({ page, page_size: pageSize, active_only: activeOnly }),
        staleTime: 30_000,
    });
 
    const allStops      = data?.items ?? [];
    const totalPages    = data?.pages ?? 1;
    const total         = data?.total ?? 0;
    const activeCount   = allStops.filter((s) =>  s.is_active).length;
    const inactiveCount = allStops.filter((s) => !s.is_active).length;

    const stops = allStops.filter((s) => {
        const matchesSearch = debouncedSearch
            ? s.stop_name.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !s.is_active :
            filterStatus === "active"   ?  s.is_active :
            true;
        return matchesSearch && matchesStatus;
    });
    // ── Open create — reset formSchoolId for fresh selection ────────────
    // Important: reset to undefined for SUPER_ADMIN so branch options
    // start empty and don't show stale data from a previous selection.
    const handleOpenCreate = () => {
        setFormSchoolId(isSuperAdmin ? undefined : schoolId);
        stopModal.openCreate();
    };

    const { createMutation, updateMutation, toggleMutation, isLoading: isMutating} = useEntityMutation<
        StopResponse,
        StopCreateRequest,
        StopUpdateRequest
    >({
        entityName: "Stop",
        queryKey: ["stops"],

        createFn: createStop,

        updateFn: updateStop,

        toggleFn: (id: number) => deactivateStop(id),

        getEntityId: (stop: StopResponse) => stop.stop_id,
    });

    const handleSubmit = async (
        data: StopCreateRequest | StopUpdateRequest
    ) => {
        if (stopModal.isEdit && stopModal.item) {
            await updateMutation.mutateAsync({
                entity: stopModal.item,
                data: data as StopUpdateRequest,
            });
        } else {
            await createMutation.mutateAsync(
                data as StopCreateRequest
            );
        }

        stopModal.close();
    };

    const tenantScope = useTenantScope();

    return (
        <div className="flex flex-col gap-5 max-w-7xl mx-auto">
           
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Stops
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Manage all stops across the platform."
                            : "Manage stops for your branch."
                        }
                    </p>
                </div>

                {canEdit && (
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add Stop
                    </button>
                )}
            </div>
             {/* ── Stat pills ──────────────────────── */}
            <StatsGrid items={[
                { value: total,         label: "Total Stops"            },
                { value: activeCount,   label: "Active",   color: "green" },
                { value: inactiveCount, label: "Inactive", color: "slate" },
            ]} />

            {/* ── Search + filter ─────────────────── */}
            <SearchFilterBar
                search={search}
                placeholder="Search by Stop Name..."
                onSearchChange={setSearch}
                filters={[
                    { label: "All",      value: "all"      },
                    { label: "Active",   value: "active"   },
                    { label: "Inactive", value: "inactive" },
                ]}
                activeFilter={filterStatus}
                onFilterChange={setFilterStatus}
            />
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : stops.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                    <div className="text-3xl mb-2">📍</div>
                    <p className="font-semibold text-slate-700">No stops found</p>
                    <p className="mt-1 text-sm text-slate-400">
                        {search
                            ? "Try a different search term."
                            : filterStatus !== "all"
                            ? `No ${filterStatus} stops.`
                            : "Add the first stop for this branch."
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stops.map((stop) => (
                        <StopCard
                            key={stop.stop_id}
                            stop={stop}
                            canEdit={canEdit}
                            onEdit={stopModal.openEdit}
                            onDeactivate={setConfirmStop}
                        />
                    ))}
                </div>
            )}

            {/* ── Pagination ───────────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                    <p className="text-xs text-slate-400">
                        Page {page} of {totalPages} · {total} drivers
                    </p>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => setPage(page - 1)}
                            disabled={page <= 1}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(page + 1)}
                            disabled={page >= totalPages}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
            {/* ── Create / Edit modal ──────────────────────────────────── */}

            <EntityModal
                open={stopModal.open}
                mode={stopModal.mode}
                entityName="Stop"
                itemName={stopModal.item?.stop_name}
                onClose={stopModal.close}
                size="md"
                createSubtitle="Enter the stop name and GPS coordinates"
            >
                <StopForm
                    mode={stopModal.mode}
                    stop={stopModal.item ?? undefined}
                    initialValues={
                        stopModal.item
                            ? {
                                stop_name: stopModal.item.stop_name,
                                latitude: stopModal.item.latitude,
                                longitude: stopModal.item.longitude,
                                is_active: stopModal.item.is_active,
                                school_id: stopModal.item.school_id,
                                branch_id: stopModal.item.branch_id,
                            }
                            : undefined
                    }
                    onSubmit={handleSubmit}
                    onCancel={stopModal.close}
                    isLoading={isMutating}
                    tenantScope={tenantScope}
                />
            </EntityModal>
            {/* ── Confirm: toggle branch status ───────── */}
            <EntityStatusConfirmModal
                open={!!confirmStop}
                entity={confirmStop}
                entityName="Stop"
                entityLabel={confirmStop?.stop_name ?? ""}
                isLoading={toggleMutation.isPending}
                onConfirm={() => confirmStop && toggleMutation.mutate(confirmStop)}
                onCancel={() => setConfirmStop(null)}
            />
        </div>
    );
};

export default StopsListPage;