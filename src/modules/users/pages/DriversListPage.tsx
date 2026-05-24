// modules/users/pages/DriversPage.tsx
// Drivers list page — updated to match project conventions:
//   • Cards with Edit / Deactivate footer actions
//   • Modal (centered overlay) for create/edit — not a slide-over
//   • Server-side search passed as ?search= query param (debounced 400ms)
//   • ConfirmModal for deactivation
//   • Multi-tenant scope (SUPER_ADMIN → no filter, SCHOOL_ADMIN → school_id,
//     BRANCH_ADMIN → school_id + branch_id)
//
// Shared components from @/core/components/ui:
//   StatusBadge, CardEditButton, ToggleActiveButton, ConfirmModal, Modal

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Plus,
    UserCog,
    Search,
    Phone,
    CreditCard,
    MapPin,
    Building2,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/hooks/useAuth";
import { useDebounce } from "@/core/hooks/useDebounce";
import { usePagination } from "@/core/hooks/usePagination";
import { formatDate, formatPhone } from "@/core/utils/formatters";
import {
    Modal,
    ConfirmModal,
    StatusBadge,
    CardEditButton,
    ToggleActiveButton,
} from "@/core/components/ui";
import DriverCard from "../components/DriverCard";
import DriverForm from "../components/DriverForm";
import {
    getDrivers,
    createDriver,
    updateDriver,
    
} from "../api";
import type { 
    DriverResponse,
    DriverCreateRequest,
    DriverUpdateRequest,
    CreateDriverPayload,
    UpdateDriverPayload
 } from "../types";
import { id } from "zod/v4/locales";

// ---------------------------------------------------------------------------
// Zod schema — mirrors backend Pydantic constraints exactly
// ---------------------------------------------------------------------------

const driverSchema = z.object({
    first_name: z
        .string()
        .min(1, "First name is required")
        .max(50, "Must be 50 characters or fewer"),

    last_name: z
        .string()
        .max(50, "Must be 50 characters or fewer")
        .optional()
        .or(z.literal("")),

    phone: z
        .string()
        .regex(
            /^[0-9+\-\s()]*$/,
            "Only digits, +, -, spaces, and parentheses are allowed",
        )
        .max(20, "Must be 20 characters or fewer")
        .optional()
        .or(z.literal("")),

    license_number: z
        .string()
        .max(30, "Must be 30 characters or fewer")
        .optional()
        .or(z.literal("")),
});

type DriverFormValues = z.infer<typeof driverSchema>;

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type FilterStatus = "all" | "active" | "inactive";

// ---------------------------------------------------------------------------
// StatPill — summary chip above the grid
// ---------------------------------------------------------------------------

const StatPill: React.FC<{
    value : number;
    label : string;
    color?: "default" | "green" | "slate" | "amber";
}> = ({ value, label, color = "default" }) => {
    const colors = {
        default: "border-slate-200 bg-white text-slate-800",
        green  : "border-green-100 bg-white text-green-700",
        slate  : "border-slate-200 bg-white text-slate-500",
        amber  : "border-amber-100 bg-white text-amber-600",
    };
    const valueColors = {
        default: "text-slate-800",
        green  : "text-green-600",
        slate  : "text-slate-500",
        amber  : "text-amber-600",
    };
    return (
        <div className={`flex items-center gap-2.5 rounded-xl border px-5 py-3 ${colors[color]}`}>
            <span className={`text-2xl font-bold tabular-nums ${valueColors[color]}`}>
                {value}
            </span>
            <span className="text-sm text-slate-500">{label}</span>
        </div>
    );
};

// ---------------------------------------------------------------------------
// DriversPage — main export
// ---------------------------------------------------------------------------

const DriversListPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { getSchoolIds, getBranchIds, hasRole } = useAuth();

    // ── Role helpers ─────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN")
    const canEditDriver = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

    // ── Tenant scope from JWT ────────────────────────────────────────────────
    const schoolIds = getSchoolIds();
    const schoolId  = schoolIds[0] as number | undefined;
    const branchIds = schoolId ? getBranchIds(schoolId) : [];
    const branchId  = branchIds[0] as number | undefined;

    // ── UI state ─────────────────────────────────────────────────────────────
    const [search, setSearch]             = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [modalOpen, setModalOpen]       = useState(false);
    const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null);
    const [confirmDriver, setConfirmDriver] = useState<DriverResponse | null>(null);

    // Debounce search — sent as ?search= query param to the API
    const debouncedSearch             = useDebounce(search, 400);
    const { page, pageSize, setPage } = usePagination(15);

    const activeOnly =
        filterStatus === "active"   ? true  :
        filterStatus === "inactive" ? false :
        undefined;

    // ── List query ───────────────────────────────────────────────────────────
    const { data: driverData, isLoading: driversLoading } = useQuery({
        queryKey: [
            "drivers",
            "list",
            { schoolId, branchId, filterStatus, page, pageSize, debouncedSearch },
        ],
        queryFn: () =>
            getDrivers({
                // SUPER_ADMIN → no filter; others → inject tenant scope
                school_id: isSuperAdmin ? undefined : schoolId,
                branch_id: isSuperAdmin || isSchoolAdmin ? undefined : branchId,
                is_active: activeOnly,
                // Server-side search — backend does ILIKE on first_name, last_name, license_number
                search   : debouncedSearch || undefined,
                page,
                page_size: pageSize,
            }),
        enabled  : isSuperAdmin || !!schoolId,
        staleTime: 30_000,
    });

    const drivers      = driverData?.items    ?? [];
    const totalPages   = driverData?.pages    ?? 1;
    const total        = driverData?.total    ?? 0;
    const activeCount  = drivers.filter((d) => d.is_active).length;
    const inactiveCount= drivers.filter((d) => !d.is_active).length;

    // ── Mutations ─────────────────────────────────────────────────────────────

    const createMutation = useMutation({
        mutationFn: ({data}: CreateDriverPayload) => createDriver(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            toast.success("Driver added successfully");
            handleModalClose();
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail || "Failed to add driver"),
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}: {id:number, data: DriverUpdateRequest}) =>
            updateDriver(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            toast.success("Driver updated successfully");
            handleModalClose();
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail || "Failed to update driver"),
    });
    {/*
    const deactivateMutation = useMutation({
        mutationFn: (driver: Driver) => deleteDriver(driver.driver_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            toast.success("Driver deactivated");
            setConfirmDriver(null);
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail || "Failed to deactivate driver"),
    });
    */}

    const toggleDriverMutation = useMutation({
        mutationFn: (driver: DriverResponse) =>
            updateDriver(driver.driver_id, {
            is_active: !driver.is_active,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            toast.success("Driver status updated successfully");
            setConfirmDriver(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update branch status");
        },
    });
    
    // ── Handlers ──────────────────────────────────────────────────────────────

    const openCreate = (): void => {
        setEditingDriver(null);
        setModalOpen(true);
    };

    const openEdit = (driver: DriverResponse): void => {
        setEditingDriver(driver);
        setModalOpen(true);
    };

    const handleModalClose = (): void => {
        setModalOpen(false);
        setEditingDriver(null);
    };


    const handleDriverSubmit = async (data: DriverFormValues) => {
        if (editingDriver) {
            await updateMutation.mutateAsync({ 
                id: editingDriver?.driver_id,
                data: {
                    ...data,
                    last_name: data.last_name || null,
                    phone: data.phone || null,
                    license_number: data.license_number || null,
                }
             });
        } else {
            await createMutation.mutateAsync({ 
                data: {
                    ...data,
                    school_id: schoolId!,
                    branch_id: branchId!,
                } });
        }
    };

    const isDriverLoading =
        createMutation.isPending || updateMutation.isPending;

    // ── Guard ─────────────────────────────────────────────────────────────────
    if (!isSuperAdmin && !schoolId) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-slate-400">
                No school assigned to your account. Contact your administrator.
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-5 max-w-7xl mx-auto">

            {/* ── Page header ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Drivers
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Manage drivers across all schools."
                            : isSchoolAdmin
                                ? "Manage your school's drivers."
                                : "Manage drivers for your branch."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Add Driver
                </button>
            </div>

            {/* ── Stat pills ───────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3">
                <StatPill value={total}         label="Total Drivers" />
                <StatPill value={activeCount}   label="Active"        color="green" />
                <StatPill value={inactiveCount} label="Inactive"      color="slate" />
            </div>

            {/* ── Search + filter bar ──────────────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="relative flex-1 max-w-lg">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Search by name or license…"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {(["all", "active", "inactive"] as FilterStatus[]).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => { setFilterStatus(s); setPage(1); }}
                            className={[
                                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors capitalize",
                                filterStatus === s
                                    ? "bg-white shadow-sm text-slate-700"
                                    : "text-slate-400 hover:text-slate-600",
                            ].join(" ")}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* ── Drivers Card grid ─────────────────────────── */}
            {driversLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : drivers.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                    <div className="text-3xl mb-2">🏢</div>
                    <p className="font-semibold text-slate-700">No Drivers found</p>
                    <p className="mt-1 text-sm text-slate-400">
                        {search
                            ? "Try a different search term."
                            : filterStatus !== "all"
                            ? `No ${filterStatus} Drivers.`
                            : "Add the first Driver for this Branch."
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {drivers.map((driver) => (
                        <DriverCard
                            key={driver.driver_id}
                            driver={driver}
                            showSchool={isSuperAdmin}
                            canEdit={canEditDriver}
                            onEdit={openEdit}
                            onDeactivate={setConfirmDriver}
                        />
                    ))}
                </div>
            )}

            {/* ── Create / Edit modal ─────────────────── */}
            <Modal
                open={modalOpen}
                title={editingDriver ? "Edit Driver" : "Add Driver"}
                subtitle={
                    editingDriver
                        ? `Editing Driver — ${String(editingDriver.driver_id).padStart(4, "0")}`
                        : "Create a Driver"
                }
                onClose={handleModalClose}
            >
                <DriverForm
                    driver={editingDriver}                       
                    onSubmit={handleDriverSubmit}
                    onCancel={handleModalClose}
                    isLoading = {isDriverLoading}
                />
            </Modal>

            {/* ── Confirm: toggle branch status ───────── */}
            {confirmDriver && (
                <ConfirmModal
                    open={!!confirmDriver}
                    title={confirmDriver.is_active ? "Deactivate Driver" : "Activate Driver"}
                    message={
                        confirmDriver.is_active
                            ? `Deactivating "${confirmDriver.first_name}" will mark it inactive.`
                            : `Reactivating "${confirmDriver.first_name}" will restore it as an active branch.`
                    }
                    confirmLabel={confirmDriver.is_active ? "Deactivate" : "Activate"}
                    danger={confirmDriver.is_active}
                    onConfirm={() => toggleDriverMutation.mutate(confirmDriver)}
                    onCancel={() => setConfirmDriver(null)}
                />
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
        </div>
    );
};

export default DriversListPage;