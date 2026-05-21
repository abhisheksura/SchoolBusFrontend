// src/modules/schools/pages/SchoolsListPage.tsx

import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/core/hooks/useAuth";
import { usePagination } from "@/core/hooks/usePagination";
import { useDebounce } from "@/core/hooks/useDebounce";
import type { SchoolResponse } from "../types";
import { SchoolCard } from "../components/SchoolCard";
import { StatPill } from "../components/SchoolCommon";
import {
    Plus, Search
} from "lucide-react";
import { getSchools } from "../api";

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
type FilterStatus = "all" | "active" | "inactive";

const SchoolsListPage: React.FC = () => {
    const navigate     = useNavigate();

    const { hasRole } = useAuth();
    const [search, setSearch]             = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    
    const debouncedSearch             = useDebounce(search, 400);
    const { page, pageSize, setPage } = usePagination(15);

    const activeOnly = filterStatus === "active"   ? true
        : filterStatus === "inactive" ? false
        : undefined;
    // -------------------------------------------------------------------------
    // Query
    // -------------------------------------------------------------------------

    const { data } = useQuery({
        queryKey: [
            "schools",
            {
                page,
                pageSize,
                search: debouncedSearch,
                filterStatus,
            },
        ],

        queryFn: () =>
            getSchools({
                page,
                page_size: pageSize,
                search: debouncedSearch || undefined,
                active_only: activeOnly,
            }),

        staleTime: 30_000,
    });

    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    // const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    

    const schools      = data?.items ?? [];
    const total        = data?.total  ?? 0;
    const activeCount  = schools.filter((b) => b.is_active).length;
    const inactiveCount= schools.filter((b) => !b.is_active).length;

    return(
        <div className="flex flex-col gap-5 max-w-7xl mx-auto">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Schools</h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Manage all schools across the platform.."
                            : "Manage your school's ."
                        }
                    </p>
                </div>

                {/* Only SUPER_ADMIN can create schools */}
                {isSuperAdmin && (
                    <button
                        type="button"
                        onClick={() => navigate("/schools/create")}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add School
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-3">
                <StatPill value={total} label="Total Schools" />
                <StatPill value={activeCount} label="Active" color="green" />
                <StatPill value={inactiveCount} label="Inactive" color="slate" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="relative flex-1 max-w-lg">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by School Name..."
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
                                filterStatus === s ? "bg-white shadow-sm text-slate-700" : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {schools.map((school) => (
                    <SchoolCard
                        key={school.school_id}
                        school={school}
                        onClick={() => navigate(`/schools/${school.school_id}`)}
                    />
                ))}
            </div>
        </div>
    );
};

export default SchoolsListPage;