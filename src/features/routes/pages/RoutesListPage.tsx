

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
    getRoutes,
    createRoute,
    updateRoute,
    deactivateRoute,
    reactivateRoute
} from "../api";
import { TenantGate }            from "@/tenant";

import type {
    RouteResponse,
    RouteCreateRequest,
    RouteUpdateRequest,
} from "../types";
import { RouteCard }           from "../components/RouteCard";
import { RouteForm }           from "../components/RouteForm";
import type { RouteFormData }  from "../components/RouteForm";

// =============================================================================
// Types
// =============================================================================

type FilterStatus = "all" | "active" | "inactive";

const RoutesListPage: React.FC = () => {
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
    const routeModal                          = useEntityModal<RouteResponse>();
    const [confirmRoute, setConfirmRoute]     = useState<RouteResponse | null>(null);

    // ── Routes query ────────────────────────────────────────────────────────
    //
    // The backend requires BOTH school_id and branch_id as query params.
    // Non-null assertions are safe because the query is disabled until
    // gate.scopeReady is true, guaranteeing both ids are defined.
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
                active_only: activeOnly,
                page,
                page_size  : pageSize,
            }),
        enabled  : gate.scopeReady,
        staleTime: 30_000,
    });

    const allRoutes     = data?.items ?? [];
    const total         = data?.total  ?? 0;
    const totalPages    = data?.pages  ?? 1;
    const activeCount   = allRoutes.filter((r: RouteResponse) =>  r.is_active).length;
    const inactiveCount = allRoutes.filter((r: RouteResponse) => !r.is_active).length;

    // Client-side search filter (backend list endpoint has no search param)
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
        entityName : "Route",
        queryKey   : ["routes"],
        createFn   : createRoute,
        /**
         * updateFn receives (id, data) — but our updateRoute API also needs
         * school_id + branch_id as query params. We wrap it here so the hook
         * stays generic.
         */
        updateFn   : (id, data) =>
            updateRoute(id, gate.resolvedSchoolId!, gate.resolvedBranchId!, data),
        /**
         * toggleFn (deactivate) also needs school_id + branch_id.
         */
        toggleFn   : (route) =>
            route.is_active
                ? deactivateRoute(
                    route.route_id,
                    {
                        school_id: gate.resolvedSchoolId!,
                        branch_id: gate.resolvedBranchId!
                    })
                : reactivateRoute(
                    route.route_id,
                    {school_id: gate.resolvedSchoolId!, branch_id: gate.resolvedBranchId!}),
        getEntityId: (r) => r.route_id,
        getEntityName  : (r)=> r.route_name,
        onCreateSuccess: () => routeModal.close(),
        onUpdateSuccess: () => routeModal.close(),
        onToggleSuccess: () => setConfirmRoute(null),
    });

    // ── Submit handler ────────────────────────────────────────────────────────

    /**
     * Unified create + edit handler.
     * On create: school_id + branch_id are injected from gate so RouteForm
     * stays completely tenant-agnostic.
     */
    const handleSubmit = async (formData: RouteFormData): Promise<void> => {
        if (routeModal.isEdit && routeModal.item) {
            await updateMutation.mutateAsync({
                entity: routeModal.item,
                data  : {
                    route_name      : formData.route_name,
                    route_code      : formData.route_code,
                    is_active       : formData.is_active,
                },
            });
        } else {
            await createMutation.mutateAsync({
                school_id       : gate.resolvedSchoolId!,
                branch_id       : gate.resolvedBranchId!,
                route_name      : formData.route_name,
                route_code      : formData.route_code,
            });
        }
    };

    // ── Create guard ──────────────────────────────────────────────────────────
    const handleOpenCreate = (): void => {
        if (!gate.scopeReady) {
            toast.error("Please select a school and branch first.");
            return;
        }
        routeModal.openCreate();
    };
    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Routes
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a School and Branch, then manage its Routes."
                            : isSchoolAdmin
                                ? "Select a Branch to view and manage its Route."
                                : "Manage Routes for your branch."
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
                        Add Route
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
                            ? "Pick a Branch above to view and manage its Routes."
                            : "Pick a School first, then choose a Branch."
                    }
                    variant="scope"
                />
            ) : (
                <>
                    {/* ── Stat pills ─────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: total,         label: "Total Routes"             },
                            { value: activeCount,   label: "Active",   color: "green"   },
                            { value: inactiveCount, label: "Inactive", color: "slate"   },
                        ]}
                    />

                    {/* ── Search + filter ────────────────────────────────── */}
                    <SearchFilterBar
                        search={search}
                        placeholder="Search by Route Name or Route Code"
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
                    ) : routes.length === 0 ? (
                        <EmptyState
                            emoji={debouncedSearch ? "🔍" : "🎓"}
                            title={
                                debouncedSearch
                                    ? `No results for "${debouncedSearch}"`
                                    : filterStatus !== "all"
                                        ? `No ${filterStatus} routes`
                                        : "No routes yet"
                            }
                            description={
                                debouncedSearch
                                    ? "Try a different search term or clear the filter"
                                    : filterStatus !== "all"
                                        ? `There are no routes marked as inactive at this time.`
                                        : "Add the first route for this branch."
                            }
                            action={
                                !debouncedSearch && filterStatus === "all" && canEdit
                                    ? {
                                        label  : "Add your first route",
                                        onClick: handleOpenCreate,
                                    }
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
                open={routeModal.open}
                mode={routeModal.mode}
                entityName="Route"
                itemName={
                    routeModal.item
                        ? routeModal.item.route_name
                        : undefined
                }
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
                entityLabel={
                    confirmRoute
                        ? confirmRoute.route_name
                        : ""
                }
                isLoading={toggleMutation.isPending}
                onConfirm={() =>
                    confirmRoute && toggleMutation.mutate(confirmRoute)
                }
                onCancel={() => setConfirmRoute(null)}
            />
        </div>
    );
};

export default RoutesListPage;