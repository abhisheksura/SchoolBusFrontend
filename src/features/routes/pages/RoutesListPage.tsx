

import React, { useState }       from "react";
import { useQuery }              from "@tanstack/react-query";
import { useAuth } from "@/features/auth/";
import { useTenantGate } from "@/tenant/hooks/useTenantGate";
import { useDebounce, usePagination } from "@/core";
import { Plus, Route as RouteIcon, Building2, GitBranch } from "lucide-react";
import { useEntityModal, useEntityMutation, EntityStatusConfirmModal } from "@/components";
import { toast }          from "sonner";
import {
    getRoutes,
    createRoute,
    updateRoute,
    deactivateRoute,
} from "../api";
import type {
    RouteResponse,
    RouteCreateRequest,
    RouteUpdateRequest,
}
from "../types";
import { RouteCard } from "../components/RouteCard";
import { TenantGate } from "@/tenant";
import {
    StatsGrid,
    SearchFilterBar,
    EmptyState,
    EntityModal
} from "@/components";

import { RouteForm } from "../components/RouteForm";
import type { RouteFormData } from "../components/RouteForm";
// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
 
type FilterStatus = "all" | "active" | "inactive";

const RoutesListPage: React.FC = () => {
    const { hasRole } = useAuth();
 
    // ── Role flags ────────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");

    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

     
    // ── Tenant gate ───────────────────────────────────────────────────────────
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
    const routeModal                          = useEntityModal<RouteResponse>();
    const [confirmRoute, setConfirmRoute]     = useState<RouteResponse | null>(null);

    // ── Routes query ──────────────────────────────────────────────────────────
    // Both resolved IDs are in the queryKey — any selector change fires a new
    // fetch automatically with the correct tenant scope.
    // Non-null assertions in the queryFn are safe because the query is disabled
    // until gate.scopeReady is true, which guarantees both IDs are defined.
    const { data, isLoading } = useQuery({
        queryKey: [
            "routes",
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
            getRoutes({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                page,
                page_size  : pageSize,
                active_only: activeOnly,
                search     : debouncedSearch || undefined,
            }),
        enabled  : gate.scopeReady,
        staleTime: 30_000,
    });
 
    const allRoutes     = data?.items ?? [];
    const total         = data?.total  ?? 0;
    const totalPages    = data?.pages  ?? 1;
    const activeCount   = allRoutes.filter((r: RouteResponse) =>  r.is_active).length;
    const inactiveCount = allRoutes.filter((r: RouteResponse) => !r.is_active).length;

    // Client-side inactive filter (backend has no inactive_only param)
    const routes = allRoutes.filter((r: RouteResponse) => {
        const matchesSearch = debouncedSearch
            ? r.route_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
              r.route_code.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !r.is_active :
            filterStatus === "active"   ?  r.is_active :
            true;
        return matchesSearch && matchesStatus;
    });
 
    // ── Mutations ─────────────────────────────────────────────────────────────
    const {
        createMutation,
        updateMutation,
        toggleMutation,
        isLoading: isMutating,
    } = useEntityMutation<RouteResponse, RouteCreateRequest, RouteUpdateRequest>({
        entityName: "Route",
        queryKey  : ["routes"],
        createFn  : createRoute,
        updateFn  : updateRoute,
        toggleFn  : deactivateRoute,
        getEntityId: (r) => r.route_id,
        onCreateSuccess: () => routeModal.close(),
        onUpdateSuccess: () => routeModal.close(),
        onToggleSuccess: () => setConfirmRoute(null),
    });

    // ── Submit handler ────────────────────────────────────────────────────────
 
    /**
     * Unified create + edit handler.
     * On create: tenant IDs are injected from gate so RouteForm stays
     * completely tenant-agnostic.
     */
    const handleSubmit = async (formData: RouteFormData) => {
        if (routeModal.isEdit && routeModal.item) {
            await updateMutation.mutateAsync({
                entity: routeModal.item,
                data  : {
                    route_code: formData.route_code,
                    route_name: formData.route_name,
                    is_active : formData.is_active,
                },
            });
        } else {
            await createMutation.mutateAsync({
                school_id : gate.resolvedSchoolId!,
                branch_id : gate.resolvedBranchId!,
                route_code: formData.route_code,
                route_name: formData.route_name,
            });
        }
    };

    // ── Create guard ──────────────────────────────────────────────────────────
    const handleOpenCreate = () => {
        if (!gate.scopeReady) {
            toast.error("Please select a school and branch first.");
            return;
        }
        routeModal.openCreate();
    };
 
    return(
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Routes
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a school and branch, then manage its routes."
                            : isSchoolAdmin
                                ? "Select a branch to view and manage its routes."
                                : "Manage routes for your branch."
                        }
                    </p>
                </div>
                {canEdit && (
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        disabled={!gate.scopeReady}
                        title={gate.scopeReady ? undefined : "Select a school and branch first"}
                        className={[
                            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                            "text-sm font-semibold text-white shadow-sm transition-colors",
                            gate.scopeReady
                                ? "bg-indigo-500 hover:bg-indigo-600"
                                : "cursor-not-allowed bg-slate-300",
                        ].join(" ")}
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add Route
                    </button>
                )}
            </div>

            {/* ── Tenant gate ───────────────────────────────────────────────── */}
            <TenantGate gate={gate} />
                        {/* ── Scope prompt or page content ─────────────────────────────── */}
            {!gate.scopeReady ? (
                <EmptyState
                    icon={<RouteIcon size={24} className="text-indigo-400" />}
                    title={
                        gate.resolvedSchoolId
                            ? "Select a branch to continue"
                            : "Select a school to continue"
                    }
                    description={
                        gate.resolvedSchoolId
                            ? "Pick a branch above to view and manage its routes."
                            : "Pick a school first, then choose a branch."
                    }
                    variant="scope"
                />
            ) : (
                <>
                    {/* ── Stat pills ─────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: total,         label: "Total Routes"              },
                            { value: activeCount,   label: "Active",   color: "green"  },
                            { value: inactiveCount, label: "Inactive", color: "slate"  },
                        ]}
                    />
 
                    {/* ── Search + filter ────────────────────────────────── */}
                    <SearchFilterBar
                        search={search}
                        placeholder="Search by code or name…"
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
                                <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />
                            ))}
                        </div>
                    ) : routes.length === 0 ? (
                        <EmptyState
                            emoji={debouncedSearch ? "🔍" : "🗺️"}
                            title={
                                debouncedSearch
                                    ? `No results for "${debouncedSearch}"`
                                    : filterStatus !== "all"
                                        ? `No ${filterStatus} routes`
                                        : "No routes yet"
                            }
                            description={
                                debouncedSearch
                                    ? "Try a different search term or clear the filter."
                                    : filterStatus !== "all"
                                        ? `Switch the filter to "All" to see all routes.`
                                        : "Create the first route for this branch."
                            }
                            action={
                                !debouncedSearch && filterStatus === "all" && canEdit
                                    ? { label: "Add your first route", onClick: handleOpenCreate }
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {routes.map((route) => (
                                <RouteCard
                                    key={route.route_id}
                                    route={route}
                                    showSchool={isSuperAdmin || isSchoolAdmin}
                                    canEdit={canEdit}
                                    onEdit={routeModal.openEdit}
                                    onToggle={setConfirmRoute}
                                />
                            ))}
                        </div>
                    )}
 
                    {/* ── Pagination ─────────────────────────────────────── */}
                    {/*
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={pageSize}
                        pageSizeOptions={[10, 15, 30, 50]}
                        entityLabel="route"
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                    />
                    */}
                </>
            )}
                        {/* ── Create / Edit modal ────────────────────────────────────────── */}
            <EntityModal
                open={routeModal.open}
                mode={routeModal.mode}
                entityName="Route"
                itemName={routeModal.item?.route_name}
                onClose={routeModal.close}
                size="md"
                createSubtitle="Enter a unique route code and a descriptive name"
            >
                <RouteForm
                    route={routeModal.item ?? undefined}
                    onSubmit={handleSubmit}
                    onCancel={routeModal.close}
                    isLoading={isMutating}
                />
            </EntityModal>
 
            {/* ── Confirm status toggle ──────────────────────────────────────── */}
            <EntityStatusConfirmModal
                open={!!confirmRoute}
                entity={confirmRoute}
                entityName="Route"
                entityLabel={confirmRoute?.route_name ?? ""}
                isLoading={toggleMutation.isPending}
                onConfirm={() => confirmRoute && toggleMutation.mutate(confirmRoute)}
                onCancel={() => setConfirmRoute(null)}
            />
        </div>
    )
};

export default RoutesListPage;