// src/modules/schools/pages/SchoolDetailPage.tsx
//
// Route:   /schools/:schoolId
// Access:  SUPER_ADMIN (edit school + branch CRUD)
//          SCHOOL_ADMIN (view school + branch CRUD for own school)
//          BRANCH_ADMIN (view own branch only — handled by RoleGuard upstream)

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, X, Check, Loader2, PowerOff, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/core/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getSchool, getBranches, updateSchool, deleteSchool } from "../api";
import type { SchoolResponse, BranchFilters } from "../types";
import { StatPill } from "../components/SchoolCommon";
import { StatusBadge, PageToggleButton, ConfirmModal } from "@/core/components/ui";
import BranchesListPage from "./BranchesListPage";

// ---------------------------------------------------------------------------
// Zod schemas — mirror backend Pydantic models exactly
// ---------------------------------------------------------------------------
const schoolEditSchema = z.object({
    school_name: z.string().min(1, "School name is required").max(200, "School name is too long"),
});
type SchoolEditFormData = z.infer<typeof schoolEditSchema>;

// ---------------------------------------------------------------------------
// School details card — read mode + inline edit (toggled by Edit button)
// ---------------------------------------------------------------------------

const SchoolDetailsCard: React.FC<{
    school: SchoolResponse;
    canEdit: boolean;
    onSaved: (updated: SchoolResponse) => void;
}> = ({ school, canEdit, onSaved }) => {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<SchoolEditFormData>({
        resolver: zodResolver(schoolEditSchema),
        defaultValues: { school_name: school.school_name },
    });

    const updateMutation = useMutation({
        mutationFn: (data: SchoolEditFormData) => updateSchool(school.school_id, data),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["schools", "detail", school.school_id] });
            queryClient.invalidateQueries({ queryKey: ["schools"] });
            toast.success("School updated successfully");
            onSaved(updated);
            setEditing(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update school");
        },
    });

    const handleCancel = () => {
        reset({ school_name: school.school_name });
        setEditing(false);
    };

    const inputClass =
        "h-11 w-full rounded-xl border-2 border-input bg-background px-4 text-sm " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
        "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">School Details</h2>
                {/* Edit / Cancel toggle — only shown when user has permission */}
                {canEdit && !editing && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-500 transition-colors"
                    >
                        <Pencil size={12} strokeWidth={2.5} /> Edit
                    </button>
                )}
                {editing && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-red-300 hover:text-red-500 transition-colors"
                    >
                        <X size={12} strokeWidth={2.5} />
                        Cancel
                    </button>
                )}
            </div>

            {/* Card body */}
            <div className="px-6 py-5">
                {editing ? (
                    /* ── Edit mode ─────────────────────────── */
                    <form
                        onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
                        className="space-y-4"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                School Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("school_name")}
                                type="text"
                                className={inputClass}
                                placeholder="e.g. Sunrise Academy"
                                disabled={updateMutation.isPending}
                                autoFocus
                            />
                            {errors.school_name && (
                                <p className="mt-1.5 text-xs text-red-500">
                                    {errors.school_name.message}
                                </p>
                            )}
                        </div>

                        {/* Read-only system field */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                School ID
                            </label>
                            <input
                                type="text"
                                value={`SCH-${String(school.school_id).padStart(4, "0")}`}
                                disabled
                                className={inputClass}
                            />
                            <p className="mt-1 text-xs text-slate-400">
                                System-generated. Cannot be changed.
                            </p>
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={updateMutation.isPending || !isDirty}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 transition-colors"
                            >
                                {updateMutation.isPending ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Check size={14} strokeWidth={2.5} />
                                )}
                                Save Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    /* ── Read mode ─────────────────────────── */
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
<div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">School Name</dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-800">{school.school_name}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">School ID</dt>
                            <dd className="mt-1 text-sm font-mono text-slate-600">SCH-{String(school.school_id).padStart(4, "0")}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</dt>
                            <dd className="mt-1"><StatusBadge active={school.is_active} /></dd>
                        </div>
                    </dl>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const SchoolDetailPage: React.FC = () => {
    const { schoolId }    = useParams<{ schoolId: string }>();
    const navigate        = useNavigate();
    const queryClient     = useQueryClient();
    const { hasRole }     = useAuth();

    const parsedSchoolId  = Number(schoolId);

    // ==================== State ====================
    const [confirmSchool,  setConfirmSchool]  = useState(false);
    const [localSchool,    setLocalSchool]    = useState<SchoolResponse | null>(null);

    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const canEditSchool = isSuperAdmin;

    // ==================== Queries ====================

    const { data: school, isLoading: schoolLoading } = useQuery({
        queryKey: ["schools", "detail", parsedSchoolId],
        queryFn: () => getSchool(parsedSchoolId),
        enabled: !!parsedSchoolId,
        staleTime: 30_000,
    });

    const branchFilters: BranchFilters = { page: 1, page_size: 100 };

    const { data: branchData } = useQuery({
        queryKey: ["branches", parsedSchoolId],
        queryFn: () => getBranches(parsedSchoolId, branchFilters),
        enabled: !!parsedSchoolId,
        staleTime: 30_000,
    });

    const displaySchool = localSchool ?? school;
    const branches      = branchData?.items ?? [];
    const activeCount   = branches.filter((b) => b.is_active).length;
    const inactiveCount = branches.filter((b) => !b.is_active).length;

    // ==================== Mutations ====================

    const toggleSchoolMutation = useMutation<void, Error, number>({
        mutationFn: (parsedSchoolId: number) => deleteSchool(parsedSchoolId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schools", "detail", parsedSchoolId] });
            queryClient.invalidateQueries({ queryKey: ["schools"] });
            toast.success( "School  Deactivated Successfully");
            setConfirmSchool(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update school status");
        },
    });

    // ==================== Loading ====================

    if (schoolLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!displaySchool) {
        return (
            <div className="flex flex-col items-center py-20 text-center">
                <p className="text-base font-semibold text-slate-700">School not found</p>
                <p className="mt-1 text-sm text-slate-400">
                    This school may have been removed or you don't have access.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/schools")}
                    className="mt-4 text-sm font-semibold text-primary hover:underline"
                >
                    Back to Schools
                </button>
            </div>
        );
    }

    // ==================== Render ====================

    return (
        <div className="flex flex-col gap-5 max-w-7xl mx-auto">
            {/* ── Back + breadcrumb ─────────────────────── */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <button
                    type="button"
                    onClick={() => navigate("/schools")}
                    className="inline-flex items-center gap-1.5 font-medium hover:text-slate-700 transition-colors"
                >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    Schools
                </button>
                <ChevronRight size={14} />
                <span className="font-semibold text-slate-700">{displaySchool.school_name}</span>
            </div>

            {/* ── Page header ───────────────────────────── */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-amber-100 bg-amber-50 text-2xl">
                        🏫
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                                {displaySchool.school_name}
                            </h1>
                            <StatusBadge active={displaySchool.is_active} />
                        </div>
                        <p className="mt-0.5 text-sm text-slate-400">
                            {branches.length} branch{branches.length !== 1 ? "es" : ""} ·
                            Last updated {displaySchool.updated_at}
                        </p>
                    </div>
                </div>

                {/* Deactivate / Activate school — SUPER_ADMIN only */}
                {canEditSchool && (
                    <PageToggleButton
                        isActive={displaySchool.is_active}
                        label={displaySchool.is_active ? "Deactivate School" : "Activate School"}
                        onClick={() => setConfirmSchool(true)}
                    />
                )}
            </div>

            {/* ── Stat pills ────────────────────────────── */}
            
            <div className="flex flex-wrap gap-3">
                <StatPill value={branches.length} label="Total Branches" />
                <StatPill value={activeCount}     label="Active"         color="green" />
                <StatPill value={inactiveCount}   label="Inactive"       color="slate" />
            </div>
            
            {/* ── School details card ───────────────────── */}
            <SchoolDetailsCard
                school={displaySchool}
                canEdit={canEditSchool}
                onSaved={(updated) => setLocalSchool(updated)}
            />

            <BranchesListPage />

            {/* ── Branch slide-over ─────────────────────── */}
            {/*
            <BranchSlideOver
                open={slideOverOpen}
                branch={editingBranch}
                schoolId={parsedSchoolId}
                isLoading={isBranchLoading}
                onSubmit={handleBranchSubmit}
                onClose={() => { setSlideOverOpen(false); setEditingBranch(null); }}
            />
            */}
            {/* ── Confirm: toggle school status ─────────── */}

            
        </div>
    );
};

export default SchoolDetailPage;