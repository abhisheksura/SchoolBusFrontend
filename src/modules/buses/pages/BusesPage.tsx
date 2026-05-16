// modules/buses/pages/BusesPage.tsx

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Plus, Bus, Pencil, X,
    Loader2, Search, Users, MapPin, Building2,
    PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/core/hooks/useAuth";
import { getBuses, createBus, updateBus, deactivateBus } from "../api";
import { getBranches, getSchools } from "@/modules/schools/api";
import { formatDate } from "@/core/utils/formatters";
import { usePagination } from "@/core/hooks/usePagination";
import { useDebounce } from "@/core/hooks/useDebounce";
import type { BusResponse } from "../types";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const busSchema = z.object({
    bus_number: z.string().min(1, "Bus number is required").max(20),
    capacity  : z.coerce.number().int().positive("Capacity must be a positive number"),
    branch_id : z.number().int().positive().optional(),
    school_id : z.number().int().positive().optional(), // SUPER_ADMIN only
});

type BusFormInput  = z.input<typeof busSchema>;
type BusFormOutput = z.output<typeof busSchema>;

// ---------------------------------------------------------------------------
// Stat pill
// ---------------------------------------------------------------------------

const StatPill: React.FC<{
    value: number;
    label: string;
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
            <span className={`text-2xl font-bold tabular-nums ${valueColors[color]}`}>{value}</span>
            <span className="text-sm text-slate-500">{label}</span>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Bus card
// ---------------------------------------------------------------------------

interface BusCardProps {
    bus        : BusResponse;
    showSchool : boolean;
    onEdit     : (bus: BusResponse) => void;
    onDeactivate: (bus: BusResponse) => void;
}

const BusCard: React.FC<BusCardProps> = ({ bus, showSchool, onEdit, onDeactivate }) => {
    const sizeLabel = bus.capacity >= 50 ? "Large Bus"
        : bus.capacity >= 30 ? "Medium Bus"
        : "Small Bus";

    return (
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                        <Bus size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-base leading-tight">{bus.bus_number}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Bus #{bus.bus_id}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    bus.is_active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${bus.is_active ? "bg-green-500" : "bg-slate-400"}`} />
                    {bus.is_active ? "Active" : "Inactive"}
                </span>
            </div>

            <div className="mx-5 mb-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3">
                    <Users size={15} className="text-amber-500 shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-amber-700">{sizeLabel}</p>
                        <p className="text-sm font-bold text-amber-800">
                            {bus.capacity}{" "}
                            <span className="font-normal text-amber-600 text-xs">seats</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1 px-5 pb-3">
                {showSchool && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Building2 size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate">{bus.school_name}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate">{bus.branch_name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Added {formatDate(bus.created_at)}</p>
            </div>

            <div className="flex items-center gap-px border-t border-slate-100 mt-auto">
                <button
                    type="button"
                    onClick={() => onEdit(bus)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                    <Pencil size={13} />
                    Edit
                </button>
                {bus.is_active && (
                    <>
                        <div className="w-px h-6 bg-slate-100" />
                        <button
                            type="button"
                            onClick={() => onDeactivate(bus)}
                            className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                            <PowerOff size={13} />
                            Deactivate
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Slide-over form
// ---------------------------------------------------------------------------

interface BusSlideOverProps {
    open         : boolean;
    onClose      : () => void;
    editingBus   : BusResponse | null;
    // For non-SUPER_ADMIN — school is fixed from JWT
    fixedSchoolId: number | undefined;
    fixedBranchId: number | undefined;
    isSuperAdmin : boolean;
    isSchoolAdmin: boolean;
}

const BusSlideOver: React.FC<BusSlideOverProps> = ({
    open, onClose, editingBus,
    fixedSchoolId, fixedBranchId,
    isSuperAdmin, isSchoolAdmin,
}) => {
    const queryClient = useQueryClient();

    // For SUPER_ADMIN: track which school is selected so we can fetch its branches
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(
        editingBus?.school_id ?? fixedSchoolId,
    );

    // The school_id to use for branch fetching
    const branchQuerySchoolId = isSuperAdmin ? selectedSchoolId : fixedSchoolId;

    // Schools list — SUPER_ADMIN only
    const { data: schoolsData } = useQuery({
        queryKey: ["schools", "list-all"],
        queryFn : () => getSchools({ active_only: true, page_size: 100 }),
        enabled : isSuperAdmin && open,
        staleTime: 60_000,
    });
    const schools = schoolsData?.items ?? [];

    // Branches list — fetched from API for all roles that show the selector
    // BRANCH_ADMIN: fixedSchoolId is set, they see their school's branches
    //               (service will reject if they pick one outside their branch)
    // SCHOOL_ADMIN: fixedSchoolId is set, sees all branches in their school
    // SUPER_ADMIN : selectedSchoolId drives the fetch
    const showBranchSelector = isSuperAdmin || isSchoolAdmin;
    const { data: branchesData, isLoading: branchesLoading } = useQuery({
        queryKey: ["branches", branchQuerySchoolId],
        queryFn : () => getBranches(branchQuerySchoolId!, { active_only: true, page_size: 100 }),
        enabled : !!branchQuerySchoolId && open,
        staleTime: 60_000,
    });
    const branches = branchesData?.items ?? [];

    const { register, handleSubmit, reset, setValue, formState: { errors } } =
        useForm<BusFormInput, any, BusFormOutput>({
            resolver: zodResolver(busSchema),
            values: editingBus
                ? {
                    bus_number: editingBus.bus_number,
                    capacity  : editingBus.capacity,
                    branch_id : editingBus.branch_id,
                    school_id : editingBus.school_id,
                  }
                : {
                    bus_number: "",
                    capacity  : 0,
                    branch_id : fixedBranchId,
                    school_id : fixedSchoolId,
                  },
        });

    const createMutation = useMutation({
        mutationFn: (values: BusFormOutput) => {
            // For SUPER_ADMIN, school_id comes from the form field
            const schoolId = isSuperAdmin ? values.school_id! : fixedSchoolId!;
            return createBus(schoolId, {
                bus_number: values.bus_number,
                capacity  : values.capacity,
                branch_id : values.branch_id!,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["buses"] });
            toast.success("Bus created successfully");
            onClose(); reset();
        },
        onError: () => toast.error("Failed to create bus"),
    });

    const updateMutation = useMutation({
        mutationFn: (values: BusFormOutput) => {
            const schoolId = editingBus!.school_id;
            return updateBus(schoolId, editingBus!.bus_id, {
                bus_number: values.bus_number,
                capacity  : values.capacity,
                ...(values.branch_id !== editingBus!.branch_id ? { branch_id: values.branch_id } : {}),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["buses"] });
            toast.success("Bus updated successfully");
            onClose();
        },
        onError: () => toast.error("Failed to update bus"),
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    const onSubmit = (values: BusFormOutput): void => {
        editingBus ? updateMutation.mutate(values) : createMutation.mutate(values);
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div className="fixed right-0 inset-y-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                            {editingBus ? "Edit Bus" : "New Bus"}
                        </p>
                        <h2 className="text-lg font-bold text-slate-800">
                            {editingBus ? `Edit ${editingBus.bus_number}` : "Add a bus"}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
                >
                    {/* School selector — SUPER_ADMIN creating; read-only when editing */}
                    {isSuperAdmin && !editingBus && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-600">
                                School <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("school_id", { valueAsNumber: true })}
                                onChange={(e) => {
                                    const id = parseInt(e.target.value, 10);
                                    setSelectedSchoolId(isNaN(id) ? undefined : id);
                                    setValue("school_id", isNaN(id) ? undefined : id);
                                    setValue("branch_id", undefined); // reset branch on school change
                                }}
                                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-white transition-all
                                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                    ${errors.school_id ? "border-red-400" : "border-slate-300 hover:border-slate-400"}`}
                            >
                                <option value="">Select a school</option>
                                {schools.map((s) => (
                                    <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
                                ))}
                            </select>
                            {errors.school_id && <p className="text-xs text-red-500">{errors.school_id.message}</p>}
                        </div>
                    )}

                    {/* School — read-only context when editing (all roles) */}
                    {editingBus && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-600">School</label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                <Building2 size={14} className="text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-600">{editingBus.school_name}</span>
                            </div>
                        </div>
                    )}

                    {/* Branch selector — SUPER_ADMIN and SCHOOL_ADMIN */}
                    {showBranchSelector ? (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-600">
                                Branch <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("branch_id", { valueAsNumber: true })}
                                disabled={isSuperAdmin && !branchQuerySchoolId}
                                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none bg-white transition-all
                                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                    disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                                    ${errors.branch_id ? "border-red-400" : "border-slate-300 hover:border-slate-400"}`}
                            >
                                <option value="">
                                    {branchesLoading ? "Loading branches…" : "Select a branch"}
                                </option>
                                {branches.map((b) => (
                                    <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                ))}
                            </select>
                            {errors.branch_id && <p className="text-xs text-red-500">{errors.branch_id.message}</p>}
                            {isSuperAdmin && !branchQuerySchoolId && (
                                <p className="text-xs text-slate-400">Select a school first to see its branches.</p>
                            )}
                        </div>
                    ) : (
                        /* Branch — read-only for BRANCH_ADMIN */
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-600">Branch</label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                <MapPin size={14} className="text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-600">
                                    {editingBus?.branch_name ?? branches[0]?.branch_name ?? "Your branch"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Bus Number */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-600">
                            Bus Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. TS10CD2345"
                            {...register("bus_number")}
                            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                ${errors.bus_number ? "border-red-400 bg-red-50/40" : "border-slate-300 bg-white hover:border-slate-400"}`}
                        />
                        {errors.bus_number && <p className="text-xs text-red-500">{errors.bus_number.message}</p>}
                    </div>

                    {/* Capacity */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-600">
                            Seating Capacity <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            placeholder="e.g. 45"
                            {...register("capacity")}
                            className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                                ${errors.capacity ? "border-red-400 bg-red-50/40" : "border-slate-300 bg-white hover:border-slate-400"}`}
                        />
                        {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
                    </div>

                    <div className="flex-1" />

                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                        <button type="button" onClick={onClose}
                            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white transition-all
                                ${isPending ? "cursor-not-allowed opacity-70" : "hover:bg-blue-600"}`}
                        >
                            {isPending && <Loader2 size={15} className="animate-spin" />}
                            {editingBus ? "Save changes" : "Create bus"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

// ---------------------------------------------------------------------------
// Confirm deactivate dialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
    open     : boolean;
    bus      : BusResponse | null;
    onConfirm: () => void;
    onCancel : () => void;
    isLoading: boolean;
}

const ConfirmDeactivateDialog: React.FC<ConfirmDialogProps> = ({
    open, bus, onConfirm, onCancel, isLoading,
}) => {
    if (!open || !bus) return null;
    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                            <PowerOff size={18} className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Deactivate Bus</h3>
                            <p className="text-xs text-slate-400">This action can be reversed later</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-6">
                        Are you sure you want to deactivate{" "}
                        <strong className="text-slate-800">{bus.bus_number}</strong>?
                        It will be removed from active routes and trips.
                    </p>
                    <div className="flex gap-3">
                        <button type="button" onClick={onCancel} disabled={isLoading}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button type="button" onClick={onConfirm} disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-70"
                        >
                            {isLoading && <Loader2 size={14} className="animate-spin" />}
                            Deactivate
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type FilterStatus = "all" | "active" | "inactive";

const BusesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { getSchoolIds, getBranchIds, hasRole } = useAuth();

    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");

    // SUPER_ADMIN has no school binding — school_id is undefined
    // SCHOOL_ADMIN / BRANCH_ADMIN — school_id is set from JWT
    const schoolIds    = getSchoolIds();
    const school_id    = schoolIds[0] as number | undefined;
    const branchIds    = school_id ? getBranchIds(school_id) : [];
    const branch_id    = branchIds[0] as number | undefined;

    const [search, setSearch]             = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [slideOverOpen, setSlideOverOpen] = useState(false);
    const [editingBus, setEditingBus]       = useState<BusResponse | null>(null);
    const [confirmBus, setConfirmBus]       = useState<BusResponse | null>(null);

    const debouncedSearch             = useDebounce(search, 400);
    const { page, pageSize, setPage } = usePagination(15);

    const activeOnly = filterStatus === "active"   ? true
        : filterStatus === "inactive" ? false
        : undefined;

    // ---------------------------------------------------------------------------
    // Query — SUPER_ADMIN uses GET /buses/ (school_id optional query param)
    //         Everyone else uses GET /schools/{school_id}/buses/
    // Both are handled by the same getBuses() function — school_id is the path param.
    // When school_id is undefined (SUPER_ADMIN), getBuses calls GET /buses/
    // When school_id is defined, getBuses calls GET /schools/{school_id}/buses/
    // ---------------------------------------------------------------------------
    const { data, isLoading } = useQuery({
        queryKey: ["buses", "list", { school_id, branch_id, filterStatus, page, pageSize, debouncedSearch }],
        queryFn : () =>
            isSuperAdmin
                // SUPER_ADMIN: global endpoint, no school required
                ? getBuses(undefined as any, {
                    active_only: activeOnly,
                    page,
                    page_size  : pageSize,
                    search     : debouncedSearch || undefined,
                })
                // Others: school-scoped endpoint
                : getBuses(school_id!, {
                    branch_id,
                    active_only: activeOnly,
                    page,
                    page_size  : pageSize,
                    search     : debouncedSearch || undefined,
                }),
        // Always enabled for SUPER_ADMIN; others need school_id
        enabled  : isSuperAdmin || !!school_id,
        staleTime: 30_000,
    });

    const buses        = data?.items ?? [];
    const totalPages   = data?.pages  ?? 1;
    const total        = data?.total  ?? 0;
    const activeCount  = buses.filter((b) => b.is_active).length;
    const inactiveCount= buses.filter((b) => !b.is_active).length;
    const totalSeats   = buses.reduce((acc, b) => acc + b.capacity, 0);

    const deactivateMutation = useMutation({
        mutationFn: (bus: BusResponse) => deactivateBus(bus.school_id, bus.bus_id),
        onSuccess : () => {
            queryClient.invalidateQueries({ queryKey: ["buses"] });
            toast.success("Bus deactivated");
            setConfirmBus(null);
        },
        onError: () => toast.error("Failed to deactivate bus"),
    });

    const openCreate = (): void => { setEditingBus(null); setSlideOverOpen(true); };
    const openEdit   = (bus: BusResponse): void => { setEditingBus(bus); setSlideOverOpen(true); };

    if (!isSuperAdmin && !school_id) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-slate-400">
                No school assigned to your account. Contact your administrator.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 max-w-7xl mx-auto">

            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Fleet</h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Manage buses across all schools."
                            : isSchoolAdmin
                                ? "Manage your school's bus fleet."
                                : "Manage your school bus fleet."
                        }
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Add Bus
                </button>
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-3">
                <StatPill value={total}         label="Total Buses" />
                <StatPill value={activeCount}    label="Active"      color="green" />
                <StatPill value={inactiveCount}  label="Inactive"    color="slate" />
                <StatPill value={totalSeats}     label="Total Seats" color="amber" />
            </div>

            {/* Search + filter bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="relative flex-1 max-w-lg">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by bus number..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {(["all", "active", "inactive"] as FilterStatus[]).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => { setFilterStatus(s); setPage(1); }}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors capitalize ${
                                filterStatus === s
                                    ? "bg-white shadow-sm text-slate-700"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 h-52">
                            <div className="flex gap-3 mb-4">
                                <div className="h-11 w-11 rounded-xl bg-slate-100" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <div className="h-4 w-28 rounded bg-slate-100" />
                                    <div className="h-3 w-16 rounded bg-slate-100" />
                                </div>
                            </div>
                            <div className="h-14 rounded-xl bg-amber-50 mb-3" />
                            <div className="h-3 w-24 rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
            ) : buses.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-24">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                        <Bus size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-400">
                        {debouncedSearch ? `No buses matching "${debouncedSearch}"` : "No buses found"}
                    </p>
                    {!debouncedSearch && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                        >
                            <Plus size={13} />
                            Add your first bus
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {buses.map((bus) => (
                        <BusCard
                            key={bus.bus_id}
                            bus={bus}
                            // Show school name for SUPER_ADMIN and SCHOOL_ADMIN
                            // (they see multiple schools/branches)
                            showSchool={isSuperAdmin || isSchoolAdmin}
                            onEdit={openEdit}
                            onDeactivate={setConfirmBus}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                    <p className="text-xs text-slate-400">
                        Page {page} of {totalPages} · {total} buses
                    </p>
                    <div className="flex gap-1.5">
                        <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Slide-over */}
            <BusSlideOver
                open={slideOverOpen}
                onClose={() => { setSlideOverOpen(false); setEditingBus(null); }}
                editingBus={editingBus}
                fixedSchoolId={school_id}
                fixedBranchId={branch_id}
                isSuperAdmin={isSuperAdmin}
                isSchoolAdmin={isSchoolAdmin}
            />

            {/* Confirm deactivate */}
            <ConfirmDeactivateDialog
                open={!!confirmBus}
                bus={confirmBus}
                onConfirm={() => confirmBus && deactivateMutation.mutate(confirmBus)}
                onCancel={() => setConfirmBus(null)}
                isLoading={deactivateMutation.isPending}
            />
        </div>
    );
};

export default BusesPage;