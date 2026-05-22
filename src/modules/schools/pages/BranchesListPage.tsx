import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/core/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import BranchCard from "../components/BranchCard";

import {
    BranchForm,
    type BranchFormData,
} from "../components/BranchForm";

import type {
    BranchResponse,
    BranchFilters,
} from "../types";

import {
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch,
} from "../api";

import { ConfirmDialog } from "../components/SchoolCommon";


// ---------------------------------------------------------------------------
// Modal — centered overlay, matches the ConfirmDialog pattern in SchoolCommon
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
                {/* Header */}
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
                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const BranchesListPage: React.FC = () => {
    const { schoolId } = useParams<{ schoolId: string }>();
    const { hasRole } = useAuth();

    const queryClient = useQueryClient();

    const parsedSchoolId = Number(schoolId);

    // ==================== State ====================

    const [modalOpen,     setModalOpen]     = useState(false);
    const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);
    const [confirmBranch, setConfirmBranch] = useState<BranchResponse | null>(null);
    
    // ==================== Permission ====================
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const canEditBranch = isSuperAdmin || isSchoolAdmin;

    // ==================== Query ====================
 
    const branchFilters: BranchFilters = { page: 1, page_size: 100 };
 
    const { data: branchData, isLoading: branchesLoading } = useQuery({
        queryKey: ["branches", parsedSchoolId, branchFilters],
        queryFn:  () => getBranches(parsedSchoolId, branchFilters),
        enabled:  !!parsedSchoolId,
        staleTime: 30_000,
    });

    const branches = branchData?.items ?? [];

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
            deleteBranch(parsedSchoolId, branch.branch_id),
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

    // ==================== Submit Handlers ====================
 
    const handleBranchSubmit = async (data: BranchFormData) => {
        if (editingBranch) {
            await updateBranchMutation.mutateAsync({ id: editingBranch.branch_id, data });
        } else {
            await createBranchMutation.mutateAsync(data);
        }
    };

    const isBranchLoading =
        createBranchMutation.isPending ||
        updateBranchMutation.isPending;

    // ─────────────────────────────────────────────────────────
    // UI
    // ─────────────────────────────────────────────────────────

    return (
        <div>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-800">
                        Branches
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-400">
                        All branches under this school
                    </p>
                </div>

                {canEditBranch && (
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                        <Plus size={15} strokeWidth={2.5} />
                        Add Branch
                    </button>
                )}
            </div>

            {/* ── Branch grid ─────────────────────────── */}
            {/* Loading */}
            {branchesLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-36 animate-pulse rounded-2xl bg-slate-100"
                        />
                    ))}
                </div>
            ) : branches.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                    <div className="mb-2 text-3xl">🏢</div>

                    <p className="font-semibold text-slate-700">
                        No branches yet
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        Add the first branch for this school.
                    </p>
                </div>
            ) : (
                /* Branch Grid */
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {branches.map((branch) => (
                        <BranchCard
                            key={branch.branch_id}
                            branch={branch}
                            canEdit={canEditBranch}
                            onEdit={openEdit}
                            onDeactivate={(b) =>
                                setConfirmBranch(b)
                            }
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

            {/* Confirm Dialog */}
            {confirmBranch && (
                <ConfirmDialog
                    title={
                        confirmBranch.is_active
                            ? "Deactivate Branch"
                            : "Activate Branch"
                    }
                    message={
                        confirmBranch.is_active
                            ? `Deactivating "${confirmBranch.branch_name}" will mark it inactive.`
                            : `Reactivating "${confirmBranch.branch_name}" will restore it as an active branch.`
                    }
                    confirmLabel={
                        confirmBranch.is_active
                            ? "Deactivate"
                            : "Activate"
                    }
                    danger={confirmBranch.is_active}
                    onConfirm={() =>
                        toggleBranchMutation.mutate(confirmBranch)
                    }
                    onCancel={() =>
                        setConfirmBranch(null)
                    }
                />
            )}
        </div>
    );
};

export default BranchesListPage;