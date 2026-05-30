// src/modules/routes/pages/RoutesListPage

import React, { useState } from "react";
import { useAuth }        from "@/features/auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { EntityModal } from "@/core/components/ui";
import { useEntityModal, useEntityMutation } from "@/components/entity";
import { StatsGrid } from "@/core/components/ui";
import type {
    RouteResponse,
    RouteCreateRequest,
    RouteUpdateRequest
} from "../types";
 import {
    getRoutes,
    createRoute,
    updateRoute,
    deactivateRoute,
} from "../api";
import { SearchFilterBar }          from "@/core/components/ui";
import { usePagination }  from "@/core/hooks/usePagination";
import { useDebounce }    from "@/core/hooks/useDebounce";
import { RouteCard }          from "../components/RouteCard";
import { RouteForm } from "../components/RouteForm";
import { useTenantScope } from "@/tenant/hooks/useTenantScope";

type FilterStatus = "all" | "active" | "inactive";

const RoutesListPage: React.FC = () => {
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

    const [formSchoolId, setFormSchoolId] = useState<number | undefined>();

    // ── Modals ───────────────────────────────────────────────────────────
    const routeModal     = useEntityModal<RouteResponse>();
    const [confirmRoute, setConfirmRoute] = useState<RouteResponse | null>(null);

    const handleOpenCreate = () => {
        console.log("clicked ->"+schoolId);
        setFormSchoolId(isSuperAdmin ? undefined : schoolId);
        routeModal.openCreate();
    };

    // ── Stops query ──────────────────────────────────────────────────────
 
    const { data, isLoading } = useQuery({
        queryKey: ["routes", { page, pageSize, filterStatus }],
        queryFn:  () =>
            getRoutes({ page, page_size: pageSize, active_only: activeOnly }),
        staleTime: 30_000,
    });

    const allRoutes      = data?.items ?? [];
    const total         = data?.total  ?? 0;
    const activeCount   = allRoutes.filter((s) =>  s.is_active).length;
    const inactiveCount = allRoutes.filter((s) => !s.is_active).length;
    const routes = allRoutes.filter((r) => {
        const matchesSearch = debouncedSearch
            ? r.route_name.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !r.is_active :
            filterStatus === "active"   ?  r.is_active :
            true;
        return matchesSearch && matchesStatus;
    });

    const { createMutation, updateMutation, isLoading: isMutating} = useEntityMutation<
        RouteResponse,
        RouteCreateRequest,
        RouteUpdateRequest
    >({
        entityName: "Route",
        queryKey: ["routes"],

        createFn: createRoute,

        updateFn: updateRoute,

        toggleFn: (id: number) => deactivateRoute(id),

        getEntityId: (route: RouteResponse) => route.route_id,
    });

    const handleSubmit = async (
        data: RouteCreateRequest | RouteUpdateRequest
    ) => {
        if (routeModal.isEdit && routeModal.item) {
            await updateMutation.mutateAsync({
                entity: routeModal.item,
                data: data as RouteUpdateRequest,
            });
        } else {
            await createMutation.mutateAsync(
                data as RouteCreateRequest
            );
        }
        routeModal.close();
    };

    const tenantScope = useTenantScope();
    
    return (
        <div className="flex flex-col gap-5 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Routes
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Manage all Routes across the platform."
                            : "Manage Routes for your branch."
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
                        Add Route
                    </button>
                )}
            </div>
            {/* ── Stat pills ──────────────────────── */}
            <StatsGrid items={[
                { value: total,         label: "Total Routes"             },
                { value: activeCount,   label: "Active",   color: "green" },
                { value: inactiveCount, label: "Inactive", color: "slate" },
            ]} />

            {/* ── Search + filter ─────────────────── */}
            <SearchFilterBar
                search={search}
                placeholder="Search by Route Name..."
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
            ) : routes.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                    <div className="text-3xl mb-2">📍</div>
                    <p className="font-semibold text-slate-700">No Routes Found</p>
                    <p className="mt-1 text-sm text-slate-400">
                        {search
                            ? "Try a different search term."
                            : filterStatus !== "all"
                            ? `No ${filterStatus} Routes.`
                            : "Add the first route for this branch."
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {routes.map((route) => (
                        <RouteCard
                            key={route.route_id}
                            route={route}
                            canEdit={canEdit}
                            onEdit={routeModal.openEdit}
                            onDeactivate={setConfirmRoute}
                        />
                    ))}
                </div>
            )}

            <EntityModal
                open={routeModal.open}
                mode={routeModal.mode}
                entityName="Route"
                itemName={routeModal.item?.route_code}
                onClose={routeModal.close}
                size="md"
                createSubtitle="Enter the Route name and Route Code"
            >
                <RouteForm
                    mode={routeModal.mode}
                    initialValues={
                        routeModal.item
                            ? {
                                route_code: routeModal.item.route_code,
                                route_name: routeModal.item.route_name,
                                is_active: routeModal.item.is_active,
                            }
                            : undefined
                    }
                    onSubmit={handleSubmit}
                    onCancel={routeModal.close}
                    isLoading={isMutating}
                    tenantScope={tenantScope}
                />
            </EntityModal>
        </div>

    );
};

export default RoutesListPage;