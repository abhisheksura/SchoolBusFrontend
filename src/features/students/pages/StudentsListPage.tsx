// src/features/students/pages/StudentsListPage.tsx
//
// Route:   /students
// Access:  SCHOOL_ADMIN, BRANCH_ADMIN (SUPER_ADMIN bypasses via RoleGuard)
//
// Follows the exact same pattern as RoutesListPage:
//   • useTenantGate() for school / branch scope selection
//   • TenantGate component rendered below the header
//   • EmptyState when scope is not yet resolved
//   • useEntityModal + useEntityMutation for CRUD
//   • EntityModal + EntityStatusConfirmModal
//   • StatsGrid + SearchFilterBar + card grid + pagination

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
import { TenantGate }            from "@/tenant";

import {
    getStudents,
    createStudent,
    updateStudent,
    deactivateStudent,
} from "../api";
import type {
    StudentResponse,
    StudentCreateRequest,
    StudentUpdateRequest,
} from "../types";
import { StudentCard }           from "../components/StudentCard";
import { StudentForm }           from "../components/StudentForm";
import type { StudentFormData }  from "../components/StudentForm";

// =============================================================================
// Types
// =============================================================================

type FilterStatus = "all" | "active" | "inactive";

// =============================================================================
// Component
// =============================================================================

const StudentsListPage: React.FC = () => {
    const { hasRole } = useAuth();

    // ── Role flags ────────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");
    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

    // ── Tenant gate ───────────────────────────────────────────────────────────
    // gate.resolvedSchoolId + gate.resolvedBranchId are the authoritative
    // tenant ids used by every query and mutation on this page.
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
    const studentModal                            = useEntityModal<StudentResponse>();
    const [confirmStudent, setConfirmStudent]     = useState<StudentResponse | null>(null);

    // ── Students query ────────────────────────────────────────────────────────
    //
    // The backend requires BOTH school_id and branch_id as query params.
    // Non-null assertions are safe because the query is disabled until
    // gate.scopeReady is true, guaranteeing both ids are defined.
    const { data, isLoading } = useQuery({
        queryKey: [
            "students",
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
            getStudents({
                school_id  : gate.resolvedSchoolId!,
                branch_id  : gate.resolvedBranchId!,
                active_only: activeOnly,
                page,
                page_size  : pageSize,
            }),
        enabled  : gate.scopeReady,
        staleTime: 30_000,
    });

    const allStudents   = data?.items ?? [];
    const total         = data?.total  ?? 0;
    const totalPages    = data?.pages  ?? 1;
    const activeCount   = allStudents.filter((s: StudentResponse) =>  s.is_active).length;
    const inactiveCount = allStudents.filter((s: StudentResponse) => !s.is_active).length;

    // Client-side search filter (backend list endpoint has no search param)
    const students = allStudents.filter((s: StudentResponse) => {
        const fullName = [s.first_name, s.last_name].filter(Boolean).join(" ");
        const matchesSearch = debouncedSearch
            ? fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
              (s.admission_number ?? "").toLowerCase().includes(debouncedSearch.toLowerCase())
            : true;
        const matchesStatus =
            filterStatus === "inactive" ? !s.is_active :
            filterStatus === "active"   ?  s.is_active :
            true;
        return matchesSearch && matchesStatus;
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const {
        createMutation,
        updateMutation,
        toggleMutation,
        isLoading: isMutating,
    } = useEntityMutation<StudentResponse, StudentCreateRequest, StudentUpdateRequest>({
        entityName : "Student",
        queryKey   : ["students"],
        createFn   : createStudent,
        /**
         * updateFn receives (id, data) — but our updateStudent API also needs
         * school_id + branch_id as query params. We wrap it here so the hook
         * stays generic.
         */
        updateFn   : (id, data) =>
            updateStudent(id, gate.resolvedSchoolId!, gate.resolvedBranchId!, data),
        /**
         * toggleFn (deactivate) also needs school_id + branch_id.
         */
        toggleFn   : (id) =>
            deactivateStudent(id, gate.resolvedSchoolId!, gate.resolvedBranchId!),
        getEntityId: (s) => s.student_id,
        onCreateSuccess: () => studentModal.close(),
        onUpdateSuccess: () => studentModal.close(),
        onToggleSuccess: () => setConfirmStudent(null),
    });

    // ── Submit handler ────────────────────────────────────────────────────────

    /**
     * Unified create + edit handler.
     * On create: school_id + branch_id are injected from gate so StudentForm
     * stays completely tenant-agnostic.
     */
    const handleSubmit = async (formData: StudentFormData): Promise<void> => {
        if (studentModal.isEdit && studentModal.item) {
            await updateMutation.mutateAsync({
                entity: studentModal.item,
                data  : {
                    first_name      : formData.first_name,
                    last_name       : formData.last_name || null,
                    admission_number: formData.admission_number || null,
                    grade           : formData.grade    || null,
                    section         : formData.section  || null,
                    is_active       : formData.is_active,
                },
            });
        } else {
            if (!formData.user_id) {
                toast.error("User ID is required to create a student.");
                return;
            }
            await createMutation.mutateAsync({
                school_id       : gate.resolvedSchoolId!,
                branch_id       : gate.resolvedBranchId!,
                user_id         : formData.user_id,
                first_name      : formData.first_name,
                last_name       : formData.last_name       || null,
                admission_number: formData.admission_number || null,
                grade           : formData.grade           || null,
                section         : formData.section         || null,
            });
        }
    };

    // ── Create guard ──────────────────────────────────────────────────────────
    const handleOpenCreate = (): void => {
        if (!gate.scopeReady) {
            toast.error("Please select a school and branch first.");
            return;
        }
        studentModal.openCreate();
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-5">

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Students
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-400">
                        {isSuperAdmin
                            ? "Select a school and branch, then manage its students."
                            : isSchoolAdmin
                                ? "Select a branch to view and manage its students."
                                : "Manage students for your branch."
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
                                : "Select a school and branch first"
                        }
                        className={[
                            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
                            "text-sm font-semibold text-white shadow-sm transition-colors",
                            gate.scopeReady
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : "cursor-not-allowed bg-slate-300",
                        ].join(" ")}
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Add Student
                    </button>
                )}
            </div>

            {/* ── Tenant gate ───────────────────────────────────────────────── */}
            <TenantGate gate={gate} />

            {/* ── Scope prompt or page content ─────────────────────────────── */}
            {!gate.scopeReady ? (
                <EmptyState
                    icon={<Users size={24} className="text-emerald-400" />}
                    title={
                        gate.resolvedSchoolId
                            ? "Select a branch to continue"
                            : "Select a school to continue"
                    }
                    description={
                        gate.resolvedSchoolId
                            ? "Pick a branch above to view and manage its students."
                            : "Pick a school first, then choose a branch."
                    }
                    variant="scope"
                />
            ) : (
                <>
                    {/* ── Stat pills ─────────────────────────────────────── */}
                    <StatsGrid
                        items={[
                            { value: total,         label: "Total Students"             },
                            { value: activeCount,   label: "Active",   color: "green"   },
                            { value: inactiveCount, label: "Inactive", color: "slate"   },
                        ]}
                    />

                    {/* ── Search + filter ────────────────────────────────── */}
                    <SearchFilterBar
                        search={search}
                        placeholder="Search by name or admission number…"
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
                    ) : students.length === 0 ? (
                        <EmptyState
                            emoji={debouncedSearch ? "🔍" : "🎓"}
                            title={
                                debouncedSearch
                                    ? `No results for "${debouncedSearch}"`
                                    : filterStatus !== "all"
                                        ? `No ${filterStatus} students`
                                        : "No students yet"
                            }
                            description={
                                debouncedSearch
                                    ? "Try a different name or admission number."
                                    : filterStatus !== "all"
                                        ? `Switch the filter to "All" to see all students.`
                                        : "Add the first student for this branch."
                            }
                            action={
                                !debouncedSearch && filterStatus === "all" && canEdit
                                    ? {
                                        label  : "Add your first student",
                                        onClick: handleOpenCreate,
                                    }
                                    : undefined
                            }
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {students.map((student) => (
                                <StudentCard
                                    key={student.student_id}
                                    student={student}
                                    showSchool={isSuperAdmin || isSchoolAdmin}
                                    canEdit={canEdit}
                                    onEdit={studentModal.openEdit}
                                    onToggle={setConfirmStudent}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── Pagination ─────────────────────────────────────── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                            <p className="text-xs text-slate-400">
                                Page {page} of {totalPages} · {total} students
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
                open={studentModal.open}
                mode={studentModal.mode}
                entityName="Student"
                itemName={
                    studentModal.item
                        ? [
                            studentModal.item.first_name,
                            studentModal.item.last_name,
                          ]
                              .filter(Boolean)
                              .join(" ")
                        : undefined
                }
                onClose={studentModal.close}
                size="md"
                createSubtitle="Student must already have a platform user account"
            >
                <StudentForm
                    student={studentModal.item ?? undefined}
                    onSubmit={handleSubmit}
                    onCancel={studentModal.close}
                    isLoading={isMutating}
                />
            </EntityModal>

            {/* ── Confirm status toggle ──────────────────────────────────────── */}
            <EntityStatusConfirmModal
                open={!!confirmStudent}
                entity={confirmStudent}
                entityName="Student"
                entityLabel={
                    confirmStudent
                        ? [confirmStudent.first_name, confirmStudent.last_name]
                              .filter(Boolean)
                              .join(" ")
                        : ""
                }
                isLoading={toggleMutation.isPending}
                onConfirm={() =>
                    confirmStudent && toggleMutation.mutate(confirmStudent)
                }
                onCancel={() => setConfirmStudent(null)}
            />
        </div>
    );
};

export default StudentsListPage;