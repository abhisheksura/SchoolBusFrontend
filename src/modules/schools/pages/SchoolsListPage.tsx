// src/modules/schools/pages/SchoolsListPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/core/hooks/useAuth";
import { usePagination } from "@/core/hooks/usePagination";
import { useDebounce } from "@/core/hooks/useDebounce";

import { SchoolCard } from "../components/SchoolCard";
import { SchoolForm } from "../components/SchoolForm";
import { StatPill } from "../components/SchoolCommon";
import { getSchools, createSchool } from "../api";
import type { SchoolFormData } from "../components/SchoolForm";

// ---------------------------------------------------------------------------
// Create School modal
// ---------------------------------------------------------------------------

const CreateSchoolModal: React.FC<{
    open:      boolean;
    isLoading: boolean;
    onSubmit:  (data: SchoolFormData) => Promise<void>;
    onClose:   () => void;
}> = ({ open, isLoading, onSubmit, onClose }) => {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Add School</h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                            SUPER_ADMIN only — visible to all roles once created
                        </p>
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
                <div className="px-6 py-6">
                    <SchoolForm
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type FilterStatus = "all" | "active" | "inactive";

const SchoolsListPage: React.FC = () => {
    const navigate    = useNavigate();
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();

    // ==================== State ====================

    const [search,       setSearch]       = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [modalOpen,    setModalOpen]    = useState(false);

    const debouncedSearch             = useDebounce(search, 400);
    const { page, pageSize, setPage } = usePagination(15);

    const isSuperAdmin = hasRole("SUPER_ADMIN");

    // active_only=true  → active only
    // active_only=false → all records (backend default is true, so false must be explicit)
    // "inactive" has no backend param — fetch all with active_only=false, filter client-side
    const activeOnly = filterStatus === "active" ? true : false;

    // ==================== Query ====================

    const { data, isLoading } = useQuery({
        // search is NOT in the queryKey — search is client-side only.
        // Only re-fetch from API when page, pageSize, or activeOnly changes.
        queryKey: ["schools", { page, pageSize, filterStatus }],
        queryFn: () =>
            getSchools({
                page,
                page_size:   pageSize,
                active_only: activeOnly,
                // No search param — backend does not support it
            }),
        staleTime: 30_000,
    });

    const allSchools = data?.items ?? [];
    const total      = data?.total  ?? 0;

    // Client-side filtering — backend has no search or inactive_only param
    const schools = allSchools.filter((s) => {
        const matchesSearch = debouncedSearch
            ? s.school_name.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !s.is_active :
            filterStatus === "active"   ?  s.is_active :
            true;
        return matchesSearch && matchesStatus;
    });

    const activeCount   = allSchools.filter((s) =>  s.is_active).length;
    const inactiveCount = allSchools.filter((s) => !s.is_active).length;

    // ==================== Mutation ====================

    const createMutation = useMutation({
        mutationFn: createSchool,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schools"] });
            toast.success("School created successfully");
            setModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to create school");
        },
    });

    // ==================== Handlers ====================

    const handleCreate = async (data: SchoolFormData) => {
        await createMutation.mutateAsync({ school_name: data.school_name });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (status: FilterStatus) => {
        setFilterStatus(status);
        setPage(1);
    };

    // ==================== Render ====================

    return (
        <div className="flex flex-col gap-5 max-w-7xl mx-auto">

            {/* ── Page header ───────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Schools</h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Manage all schools across the platform."
                            : "Manage your school."
                        }
                    </p>
                </div>
                {isSuperAdmin && (
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add School
                    </button>
                )}
            </div>

            {/* ── Stat pills ────────────────────────── */}
            <div className="flex flex-wrap gap-3">
                <StatPill value={total}        label="Total Schools" />
                <StatPill value={activeCount}  label="Active"        color="green" />
                <StatPill value={inactiveCount}label="Inactive"      color="slate" />
            </div>

            {/* ── Search + filter bar ───────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="relative flex-1 max-w-lg">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Search by School Name..."
                        value={search}
                        onChange={handleSearchChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {(["all", "active", "inactive"] as FilterStatus[]).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => handleFilterChange(s)}
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

            {/* ── School cards grid ─────────────────── */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : schools.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
                    <div className="text-4xl mb-3">🏫</div>
                    <p className="font-semibold text-slate-700">No schools found</p>
                    <p className="mt-1 text-sm text-slate-400">
                        {search
                            ? "Try a different search term."
                            : filterStatus !== "all"
                            ? `No ${filterStatus} schools.`
                            : "Create the first school to get started."
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {schools.map((school) => (
                        <SchoolCard
                            key={school.school_id}
                            school={school}
                            onClick={() => navigate(`/schools/${school.school_id}`)}
                        />
                    ))}
                </div>
            )}

            {/* ── Create School modal ───────────────── */}
            <CreateSchoolModal
                open={modalOpen}
                isLoading={createMutation.isPending}
                onSubmit={handleCreate}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
};

export default SchoolsListPage;