// src/modules/schools/pages/BranchesListPage.tsx

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/core/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import BranchCard from "../components/BranchCard";
import { BranchForm } from "../components/BranchForm";
import type { BranchResponse, BranchFilters } from "../types";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api";
import { ConfirmDialog } from "../components/SchoolCommon";


const BranchesListPage: React.FC = () => {
    const { schoolId }    = useParams<{ schoolId: string }>();
    const { hasRole }     = useAuth();
    
    const parsedSchoolId  = Number(schoolId);
    const queryClient          = useQueryClient();

    // ==================== State ====================
    const [slideOverOpen,  setSlideOverOpen]  = useState(false);
    const [editingBranch,  setEditingBranch]  = useState<BranchResponse | null>(null);
    const [confirmBranch,  setConfirmBranch]  = useState<BranchResponse | null>(null);
    
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const canEditBranch = isSuperAdmin || isSchoolAdmin;
    const branchFilters: BranchFilters = { page: 1, page_size: 100 };

    const { data: branchData, isLoading: branchesLoading } = useQuery({
        queryKey: ["branches", parsedSchoolId, branchFilters],
        queryFn:  () => getBranches(parsedSchoolId, branchFilters),
        enabled:  !!parsedSchoolId,
        staleTime: 30_000,
    });

    const branches      = branchData?.items ?? [];
    const activeCount   = branches.filter((b) => b.is_active).length;
    const inactiveCount = branches.filter((b) => !b.is_active).length;

    const openCreate = () => {
        setEditingBranch(null);
        setSlideOverOpen(true);
    };

    const openEdit = (branch: BranchResponse) => {
        setEditingBranch(branch);
        setSlideOverOpen(true);
    };
    
    // ==================== Mutations ====================

    const createBranchMutation = useMutation({
        mutationFn: (data: BranchFormData) =>
            createBranch(parsedSchoolId, {
                school_id:      parsedSchoolId,   // required by BranchCreateRequest
                branch_name:    data.branch_name,
                branch_address: data.branch_address?.trim() || null,
                branch_phone:   data.branch_phone?.trim()   || null,
                branch_email:   data.branch_email?.trim()   || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches", parsedSchoolId] });
            toast.success("Branch created successfully");
            setSlideOverOpen(false);
            setEditingBranch(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to create branch");
        },
    });
    
    const updateBranchMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: BranchFormData }) =>
            updateBranch(parsedSchoolId, id, {
                branch_name:    data.branch_name,
                branch_address: data.branch_address || null,
                branch_phone:   data.branch_phone   || null,
                branch_email:   data.branch_email   || null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["branches", parsedSchoolId] });
            toast.success("Branch updated successfully");
            setSlideOverOpen(false);
            setEditingBranch(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update branch");
        },
    });

    const toggleBranchMutation = useMutation({
        mutationFn: (branch: BranchResponse) =>
            deleteBranch(parsedSchoolId, branch.branch_id),   // soft-delete
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
    
    const handleBranchSubmit = async (data: BranchFormData) => {
        if (editingBranch) {
            await updateBranchMutation.mutateAsync({ id: editingBranch.branch_id, data });
        } else {
            await createBranchMutation.mutateAsync(data);
        }
    };

    const isBranchLoading =
        createBranchMutation.isPending || updateBranchMutation.isPending;
    
    const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
        title,
        message,
        confirmLabel,
        danger,
        onConfirm,
        onCancel,
    }) => {
        return (
            <div>
                <h2>{title}</h2>
                <p>{message}</p>

                <button onClick={onCancel}>Cancel</button>
                <button
                    onClick={onConfirm}
                    style={{ color: danger ? "red" : "black" }}
                >
                    {confirmLabel}
                </button>
            </div>
        );
    };
    return(
        <div>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-800">Branches</h2>
                    <p className="mt-0.5 text-sm text-slate-400">
                        All branches under this school
                    </p>
                </div>
                {/* Only SUPER_ADMIN and SCHOOL_ADMIN can add branches */}
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

            {branchesLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : branches.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                    <div className="text-3xl mb-2">🏢</div>
                    <p className="font-semibold text-slate-700">No branches yet</p>
                    <p className="mt-1 text-sm text-slate-400">
                        Add the first branch for this school.
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
            {/* ── Confirm: toggle branch status ─────────── */}
            
            {confirmBranch && (
                <ConfirmDialog
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