// src/modules/schools/pages/BranchesListPage.tsx

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/core/hooks/useAuth";
import { useDebounce } from "@/core/hooks/useDebounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import BranchCard from "../components/BranchCard";
import { BranchForm } from "../components/BranchForm";
import type { BranchFormData } from "../components/BranchForm";
import { ConfirmModal } from "@/core/components/ui/Modal";
import type { BranchResponse } from "../types";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api";

// ---------------------------------------------------------------------------
// Modal — centered overlay
// ---------------------------------------------------------------------------

const Modal: React.FC<{
    open:     boolean;
    title:    string;
    subtitle: string;
    onClose:  () => void;
    children: React.ReactNode;
}> = ({ open, title, subtitle, onClose, children }) => {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">{title}</h2>
                        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type FilterStatus = "all" | "active" | "inactive";

const BranchesListPage: React.FC = () => {
    const { schoolId }   = useParams<{ schoolId: string }>();
    const { hasRole }    = useAuth();
    const queryClient    = useQueryClient();

    const parsedSchoolId = Number(schoolId);

    // ==================== State ====================

    const [search,        setSearch]        = useState("");
    const [filterStatus,  setFilterStatus]  = useState<FilterStatus>("all");
    const [modalOpen,     setModalOpen]     = useState(false);
    const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);
    const [confirmBranch, setConfirmBranch] = useState<BranchResponse | null>(null);

    const debouncedSearch = useDebounce(search, 400);

    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const canEditBranch = isSuperAdmin || isSchoolAdmin;

    // active_only=true  → active only
    // active_only=false → all records (backend default is true, so false must be explicit)
    // "inactive" has no backend param — fetch all with active_only=false, filter client-side
    const activeOnly = filterStatus === "active" ? true : false;

    // ==================== Query ====================

    const { data: branchData, isLoading: branchesLoading } = useQuery({
        // search is NOT in the queryKey — search is client-side only.
        // Only re-fetch from API when schoolId or activeOnly changes.
        queryKey: ["branches", parsedSchoolId, { filterStatus }],
        queryFn: () =>
            getBranches(parsedSchoolId, {
                page:        1,
                page_size:   100,
                active_only: activeOnly,
                // No search param — backend does not support it
            }),
        enabled:   !!parsedSchoolId,
        staleTime: 30_000,
    });

    const allBranches = branchData?.items ?? [];

    // Client-side filtering — backend has no search or inactive_only param
    const branches = allBranches.filter((b) => {
        const matchesSearch = debouncedSearch
            ? b.branch_name.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !b.is_active :
            filterStatus === "active"   ?  b.is_active :
            true;
        return matchesSearch && matchesStatus;
    });

    // ==================== Mutations ====================

    const createBranchMutation = useMutation({
        mutationFn: (data: BranchFormData) =>
            createBranch(parsedSchoolId, {
                school_id:      parsedSchoolId,
                branch_name:    data.branch_name,
                branch_address: data.branch_address?.trim() || null,
                branch_phone:   data.branch_phone?.trim()   || null,
                branch_email:   data.branch_email?.trim()   || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches", parsedSchoolId] });
            toast.success("Branch created successfully");
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to create branch");
        },
    });

    const updateBranchMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: BranchFormData }) =>
            updateBranch(parsedSchoolId, id, {
                branch_name:    data.branch_name,
                branch_address: data.branch_address?.trim() || null,
                branch_phone:   data.branch_phone?.trim()   || null,
                branch_email:   data.branch_email?.trim()   || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches", parsedSchoolId] });
            toast.success("Branch updated successfully");
            handleClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update branch");
        },
    });

    const toggleBranchMutation = useMutation({
        mutationFn: (branch: BranchResponse) =>
            updateBranch(parsedSchoolId, branch.branch_id, {
            is_active: !branch.is_active,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches", parsedSchoolId] });
            toast.success("Branch status updated successfully");
            setConfirmBranch(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update branch status");
        },
    });

    // ==================== Handlers ====================

    const openCreate = () => {
        setEditingBranch(null);
        setModalOpen(true);
    };

    const openEdit = (branch: BranchResponse) => {
        setEditingBranch(branch);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setEditingBranch(null);
    };

    const handleBranchSubmit = async (data: BranchFormData) => {
        if (editingBranch) {
            await updateBranchMutation.mutateAsync({ id: editingBranch.branch_id, data });
        } else {
            await createBranchMutation.mutateAsync(data);
        }
    };

    const isBranchLoading =
        createBranchMutation.isPending || updateBranchMutation.isPending;

    // ==================== Render ====================

    return (
        <div className="flex flex-col gap-4">

            {/* ── Section header ──────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-800">Branches</h2>
                    <p className="mt-0.5 text-sm text-slate-400">
                        All branches under this school
                    </p>
                </div>
                {canEditBranch && (
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                    >
                        <Plus size={15} strokeWidth={2.5} />
                        Add Branch
                    </button>
                )}
            </div>

            {/* ── Search + filter bar ─────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="relative flex-1 max-w-lg">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Search by Branch Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {(["all", "active", "inactive"] as FilterStatus[]).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setFilterStatus(s)}
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

            {/* ── Branch grid ─────────────────────────── */}
            {branchesLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : branches.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                    <div className="text-3xl mb-2">🏢</div>
                    <p className="font-semibold text-slate-700">No branches found</p>
                    <p className="mt-1 text-sm text-slate-400">
                        {search
                            ? "Try a different search term."
                            : filterStatus !== "all"
                            ? `No ${filterStatus} branches.`
                            : "Add the first branch for this school."
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {branches.map((branch) => (
                        <BranchCard
                            key={branch.branch_id}
                            branch={branch}
                            canEdit={canEditBranch}
                            onEdit={openEdit}
                            onDeactivate={(b) => setConfirmBranch(b)}
                        />
                    ))}
                </div>
            )}

            {/* ── Create / Edit modal ─────────────────── */}
            <Modal
                open={modalOpen}
                title={editingBranch ? "Edit Branch" : "Add Branch"}
                subtitle={
                    editingBranch
                        ? `Editing — ${editingBranch.branch_name}`
                        : `Under School ID SCH-${String(parsedSchoolId).padStart(4, "0")}`
                }
                onClose={handleClose}
            >
                <BranchForm
                    branch={editingBranch ?? undefined}
                    onSubmit={handleBranchSubmit}
                    onCancel={handleClose}
                    isLoading={isBranchLoading}
                />
            </Modal>

            {/* ── Confirm: toggle branch status ───────── */}
            {confirmBranch && (
                <ConfirmModal
                    open={!!confirmBranch}
                    title={confirmBranch.is_active ? "Deactivate Branch" : "Activate Branch"}
                    message={
                        confirmBranch.is_active
                            ? `Deactivating "${confirmBranch.branch_name}" will mark it inactive.`
                            : `Reactivating "${confirmBranch.branch_name}" will restore it as an active branch.`
                    }
                    confirmLabel={confirmBranch.is_active ? "Deactivate" : "Activate"}
                    danger={confirmBranch.is_active}
                    onConfirm={() => toggleBranchMutation.mutate(confirmBranch)}
                    onCancel={() => setConfirmBranch(null)}
                />
            )}
        </div>
    );
};

export default BranchesListPage;