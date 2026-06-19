// src/features/students/pages/StudentDetailPage.tsx
//
// Route:   /students/:studentId
// Access:  SCHOOL_ADMIN, BRANCH_ADMIN (SUPER_ADMIN bypasses via RoleGuard)
//
// ── What this page does ───────────────────────────────────────────────────────
//
//   Three sections rendered as tabs:
//
//   1. "Details" — student info card with inline edit (same pattern as
//      SchoolDetailsPage). Name, grade, section, admission number, status.
//
//   2. "Parents" — lists every parent linked to this student.
//      Actions per row:
//         • Edit relationship label / is_primary flag
//         • Unlink (ConfirmModal before DELETE)
//      Add-parent panel:
//         • Search existing parents in the school (GET /students/parents/)
//         • Link selected parent with relationship label + is_primary flag
//
//   3. "Leave Requests" — paginated list of this student's leave requests.
//      PENDING → Approve / Reject inline buttons.
//      Create new leave request via modal form.
//
// ── Tenant context ────────────────────────────────────────────────────────────
//
//   schoolId + branchId come from React Router location.state, set by
//   StudentCard.goToDetail(). If the user navigates directly (bookmark /
//   page refresh) the location state is empty — in that case we fall back
//   to reading school_id + branch_id from the fetched StudentResponse.

import React, { useState, useEffect, useCallback } from "react";
import {
    useParams,
    useNavigate,
    useLocation,
}                                            from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm }                          from "react-hook-form";
import { zodResolver }                      from "@hookform/resolvers/zod";
import { z }                               from "zod";
import {
    ArrowLeft,
    GraduationCap,
    Users,
    CalendarOff,
    Pencil,
    X,
    Check,
    Loader2,
    Star,
    StarOff,
    Unlink,
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Phone,
    Mail,
    MapPin,
}                                            from "lucide-react";
import { toast }                             from "sonner";

import { useAuth }                           from "@/features/auth/";
import {
    StatusBadge,
    ConfirmModal,
    PageToggleButton,
    EntityModal,
    useEntityModal,
}                                            from "@/components";
import { formatDate }                        from "@/core/utils/formatters";
//import {
//    LEAVE_STATUS_LABELS,
//    LEAVE_STATUS_COLORS,
//}                                            from "@/core/utils/constants";
import {
    getStudent,
    updateStudent,
    deactivateStudent,
    getStudentParents,
    getParents,
    linkParentToStudent,
    updateStudentParentLink,
    unlinkParentFromStudent,
    //getLeaveRequests,
    // createLeaveRequest,
    //updateLeaveRequestStatus,
}                                            from "../api";
import { ParentForm }                        from "../components/ParentForm";
import type { ParentFormData }               from "../components/ParentForm";
import type {
    StudentResponse,
    StudentUpdateRequest,
    ParentResponse,
    StudentParentResponse,
    // LeaveRequestResponse,
    //LeaveRequestStatus,
}                                            from "../types";

// =============================================================================
// Tab IDs
// =============================================================================

type TabId = "details" | "parents" | "leaves";

// =============================================================================
// Styles — shared across sections
// =============================================================================

const INPUT =
    "h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-sm " +
    "text-slate-800 outline-none transition-all duration-150 " +
    "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-emerald-400 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

const LABEL = "mb-2 block text-sm font-semibold text-slate-700";

// =============================================================================
// Zod schema — student inline edit
// =============================================================================

const studentEditSchema = z.object({
    first_name      : z.string().min(1, "Required").max(100),
    last_name       : z.string().max(100).optional().or(z.literal("")),
    admission_number: z.string().max(50).optional().or(z.literal("")),
    grade           : z.string().max(20).optional().or(z.literal("")),
    section         : z.string().max(10).optional().or(z.literal("")),
});

type StudentEditFormData = z.infer<typeof studentEditSchema>;

// =============================================================================
// Zod schema — leave request create
// =============================================================================

const leaveSchema = z.object({
    start_date: z.string().min(1, "Start date is required"),
    end_date  : z.string().min(1, "End date is required"),
    reason    : z.string().max(500).optional().or(z.literal("")),
}).refine(
    (d) => new Date(d.end_date) >= new Date(d.start_date),
    { message: "End date must be on or after start date", path: ["end_date"] },
);

type LeaveFormData = z.infer<typeof leaveSchema>;

// =============================================================================
// Location state shape (set by StudentCard)
// =============================================================================

interface StudentDetailState {
    breadcrumbLabel?: string;
    schoolId        : number;
    branchId        : number;
}


// =============================================================================
// Sub-component — StudentDetailsCard (inline edit)
// =============================================================================

interface StudentDetailsCardProps {
    student : StudentResponse;
    canEdit : boolean;
    onSaved : (updated: StudentResponse) => void;
    schoolId: number;
    branchId: number;
}

const StudentDetailsCard: React.FC<StudentDetailsCardProps> = ({
    student,
    canEdit,
    onSaved,
    schoolId,
    branchId,
}) => {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<StudentEditFormData>({
        resolver: zodResolver(studentEditSchema),
        defaultValues: {
            first_name      : student.first_name,
            last_name       : student.last_name       ?? "",
            admission_number: student.admission_number ?? "",
            grade           : student.grade           ?? "",
            section         : student.section         ?? "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: StudentUpdateRequest) =>
            updateStudent(student.student_id, schoolId, branchId, data),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({
                queryKey: ["students", "detail", student.student_id],
            });
            toast.success("Student updated");
            onSaved(updated);
            setEditing(false);
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to update student"),
    });

    const handleCancel = () => {
        reset();
        setEditing(false);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Student Details
                </h2>
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
                        <X size={12} strokeWidth={2.5} /> Cancel
                    </button>
                )}
            </div>

            <div className="px-6 py-5">
                {editing ? (
                    <form
                        onSubmit={handleSubmit((d) =>
                            updateMutation.mutate({
                                first_name      : d.first_name,
                                last_name       : d.last_name       || null,
                                admission_number: d.admission_number || null,
                                grade           : d.grade           || null,
                                section         : d.section         || null,
                            })
                        )}
                        className="space-y-4"
                    >
                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL}>
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register("first_name")}
                                    type="text"
                                    disabled={updateMutation.isPending}
                                    autoFocus
                                    className={INPUT}
                                />
                                {errors.first_name && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.first_name.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className={LABEL}>Last Name</label>
                                <input
                                    {...register("last_name")}
                                    type="text"
                                    disabled={updateMutation.isPending}
                                    className={INPUT}
                                />
                            </div>
                        </div>

                        {/* Grade / Section */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL}>Grade</label>
                                <input
                                    {...register("grade")}
                                    type="text"
                                    disabled={updateMutation.isPending}
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>Section</label>
                                <input
                                    {...register("section")}
                                    type="text"
                                    disabled={updateMutation.isPending}
                                    className={INPUT}
                                />
                            </div>
                        </div>

                        {/* Admission number */}
                        <div>
                            <label className={LABEL}>Admission Number</label>
                            <input
                                {...register("admission_number")}
                                type="text"
                                disabled={updateMutation.isPending}
                                className={INPUT}
                            />
                        </div>

                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                disabled={updateMutation.isPending || !isDirty}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                            >
                                {updateMutation.isPending
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Check size={14} strokeWidth={2.5} />
                                }
                                Save Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Read mode */
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Full Name
                            </dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-800">
                                {[student.first_name, student.last_name]
                                    .filter(Boolean)
                                    .join(" ")}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Student ID
                            </dt>
                            <dd className="mt-1 font-mono text-sm text-slate-600">
                                STU-{String(student.student_id).padStart(4, "0")}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Grade
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                                {student.grade ?? "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Section
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                                {student.section ?? "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Admission Number
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                                {student.admission_number ?? "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Status
                            </dt>
                            <dd className="mt-1">
                                <StatusBadge active={student.is_active} />
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Added
                            </dt>
                            <dd className="mt-1 text-sm text-slate-500">
                                {formatDate(student.created_at)}
                            </dd>
                        </div>
                    </dl>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// Sub-component — ParentsTab
// =============================================================================

interface ParentsTabProps {
    student : StudentResponse;
    schoolId: number;
    branchId: number;
    canEdit : boolean;
}

const ParentsTab: React.FC<ParentsTabProps> = ({
    student,
    schoolId,
    branchId,
    canEdit,
}) => {
    const queryClient = useQueryClient();
    const parentModal                              = useEntityModal<ParentResponse>();
    const [confirmUnlink, setConfirmUnlink]        = useState<StudentParentResponse | null>(null);
    const [linkPanelOpen, setLinkPanelOpen]        = useState(false);
    const [searchTerm,    setSearchTerm]           = useState("");
    const [selectedParent, setSelectedParent]      = useState<ParentResponse | null>(null);
    const [relationship,  setRelationship]         = useState("GUARDIAN");
    const [isPrimary,     setIsPrimary]            = useState(false);

    // ── Linked parents ───────────────────────────────────────────────────────
    const { data: linkedParents = [], isLoading: linkedLoading } = useQuery({
        queryKey: ["student-parents", student.student_id, schoolId, branchId],
        queryFn : () =>
            getStudentParents(student.student_id, schoolId, branchId),
        staleTime: 30_000,
    });

    // ── School parents list (for search / link panel) ────────────────────────
    const { data: schoolParentsData, isLoading: schoolParentsLoading } = useQuery({
        queryKey: ["parents", "school", schoolId],
        queryFn : () => getParents({ school_id: schoolId, active_only: true, page_size: 200 }),
        enabled : linkPanelOpen,
        staleTime: 60_000,
    });

    const schoolParents = schoolParentsData?.items ?? [];

    /** Parents from the school list not yet linked to this student. */
    const linkedIds = new Set(linkedParents.map((lp) => lp.parent_id));
    const availableParents = schoolParents.filter(
        (p) =>
            !linkedIds.has(p.parent_id) &&
            (searchTerm
                ? [p.first_name, p.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                : true),
    );

    // ── Create parent mutation ───────────────────────────────────────────────
    const createParentMutation = useMutation({
        mutationFn: (data: ParentFormData) => {
            const { createParent } = require("../api");
            return createParent({
                school_id      : schoolId,
                user_id        : data.user_id!,
                first_name     : data.first_name,
                last_name      : data.last_name      || null,
                phone          : data.phone          || null,
                alternate_phone: data.alternate_phone || null,
                email          : data.email          || null,
                address        : data.address        || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parents", "school", schoolId] });
            toast.success("Parent created");
            parentModal.close();
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to create parent"),
    });

    // ── Link parent mutation ─────────────────────────────────────────────────
    const linkMutation = useMutation({
        mutationFn: () =>
            linkParentToStudent(student.student_id, schoolId, branchId, {
                parent_id   : selectedParent!.parent_id,
                relationship,
                is_primary  : isPrimary,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["student-parents", student.student_id],
            });
            toast.success("Parent linked");
            setLinkPanelOpen(false);
            setSelectedParent(null);
            setRelationship("GUARDIAN");
            setIsPrimary(false);
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to link parent"),
    });

    // ── Unlink mutation ──────────────────────────────────────────────────────
    const unlinkMutation = useMutation({
        mutationFn: (sp: StudentParentResponse) =>
            unlinkParentFromStudent(
                student.student_id,
                sp.student_parent_id,
                schoolId,
                branchId,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["student-parents", student.student_id],
            });
            toast.success("Parent unlinked");
            setConfirmUnlink(null);
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to unlink parent"),
    });

    // ── Toggle primary mutation ──────────────────────────────────────────────
    const togglePrimaryMutation = useMutation({
        mutationFn: (sp: StudentParentResponse) =>
            updateStudentParentLink(
                student.student_id,
                sp.student_parent_id,
                schoolId,
                branchId,
                { is_primary: !sp.is_primary },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["student-parents", student.student_id],
            });
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to update"),
    });

    // ── Helper — resolve parent name from school list ────────────────────────
    const getParentName = useCallback(
        (parentId: number): string => {
            const p = schoolParents.find((sp) => sp.parent_id === parentId);
            if (!p) return `Parent #${parentId}`;
            return [p.first_name, p.last_name].filter(Boolean).join(" ");
        },
        [schoolParents],
    );

    return (
        <div className="flex flex-col gap-4">

            {/* ── Section header ────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-slate-700">
                        Linked Parents / Guardians
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                        {linkedParents.length} linked
                    </p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => parentModal.openCreate()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                        >
                            <Plus size={13} strokeWidth={2.5} />
                            New Parent
                        </button>
                        <button
                            type="button"
                            onClick={() => setLinkPanelOpen((p) => !p)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
                        >
                            <Plus size={13} strokeWidth={2.5} />
                            Link Existing
                        </button>
                    </div>
                )}
            </div>

            {/* ── Link existing parent panel ────────────────────────── */}
            {linkPanelOpen && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Link an existing parent from this school
                    </p>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search parent by name…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    />

                    {/* Parent list */}
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                        {schoolParentsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={16} className="animate-spin text-slate-300" />
                            </div>
                        ) : availableParents.length === 0 ? (
                            <p className="px-4 py-6 text-center text-xs text-slate-400">
                                {searchTerm
                                    ? "No parents match your search."
                                    : "All school parents are already linked."}
                            </p>
                        ) : (
                            availableParents.map((p) => (
                                <button
                                    key={p.parent_id}
                                    type="button"
                                    onClick={() => setSelectedParent(
                                        selectedParent?.parent_id === p.parent_id ? null : p,
                                    )}
                                    className={[
                                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                                        selectedParent?.parent_id === p.parent_id
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "hover:bg-slate-50 text-slate-700",
                                    ].join(" ")}
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                                        {p.first_name[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">
                                            {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                                        </p>
                                        {p.phone && (
                                            <p className="text-xs text-slate-400">{p.phone}</p>
                                        )}
                                    </div>
                                    {selectedParent?.parent_id === p.parent_id && (
                                        <Check size={14} className="ml-auto shrink-0 text-emerald-500" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Relationship + primary fields */}
                    {selectedParent && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    Relationship
                                </label>
                                <select
                                    value={relationship}
                                    onChange={(e) => setRelationship(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                                >
                                    {["FATHER", "MOTHER", "GUARDIAN", "GRANDPARENT", "SIBLING", "OTHER"].map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isPrimary}
                                        onChange={(e) => setIsPrimary(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                                    />
                                    <span className="text-sm font-medium text-slate-700">
                                        Primary contact
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Link / cancel */}
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={() => linkMutation.mutate()}
                            disabled={!selectedParent || linkMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                            {linkMutation.isPending && (
                                <Loader2 size={13} className="animate-spin" />
                            )}
                            Link Parent
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLinkPanelOpen(false);
                                setSelectedParent(null);
                                setSearchTerm("");
                            }}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Linked parents list ───────────────────────────────── */}
            {linkedLoading ? (
                <div className="flex flex-col gap-2 animate-pulse">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-16 rounded-2xl bg-slate-100" />
                    ))}
                </div>
            ) : linkedParents.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                    <Users size={28} className="text-slate-200 mb-2" />
                    <p className="text-sm font-medium text-slate-400">
                        No parents linked yet
                    </p>
                    {canEdit && (
                        <p className="mt-1 text-xs text-slate-400">
                            Use "Link Existing" or "New Parent" above.
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {linkedParents.map((sp) => (
                        <div
                            key={sp.student_parent_id}
                            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                        >
                            {/* Avatar */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-600">
                                {getParentName(sp.parent_id)[0]?.toUpperCase() ?? "P"}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                        {getParentName(sp.parent_id)}
                                    </p>
                                    {sp.is_primary && (
                                        <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                                            Primary
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 capitalize">
                                    {sp.relationship.toLowerCase()} · Linked {formatDate(sp.created_at)}
                                </p>
                            </div>

                            {/* Actions */}
                            {canEdit && (
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        title={sp.is_primary ? "Remove primary" : "Set as primary"}
                                        onClick={() => togglePrimaryMutation.mutate(sp)}
                                        disabled={togglePrimaryMutation.isPending}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                                    >
                                        {sp.is_primary
                                            ? <Star size={14} fill="currentColor" className="text-amber-400" />
                                            : <StarOff size={14} />
                                        }
                                    </button>
                                    <button
                                        type="button"
                                        title="Unlink parent"
                                        onClick={() => setConfirmUnlink(sp)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <Unlink size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create new parent modal ───────────────────────────── */}
            <EntityModal
                open={parentModal.open}
                mode="create"
                entityName="Parent"
                onClose={parentModal.close}
                size="md"
                createSubtitle="Parent must already have a platform user account"
            >
                <ParentForm
                    onSubmit={(d) => createParentMutation.mutateAsync(d)}
                    onCancel={parentModal.close}
                    isLoading={createParentMutation.isPending}
                />
            </EntityModal>

            {/* ── Confirm unlink ────────────────────────────────────── */}
            <ConfirmModal
                open={!!confirmUnlink}
                title="Unlink Parent"
                message={
                    confirmUnlink
                        ? `Remove "${getParentName(confirmUnlink.parent_id)}" as ${confirmUnlink.relationship.toLowerCase()} of this student? Neither record will be deleted.`
                        : ""
                }
                confirmLabel="Unlink"
                danger
                isLoading={unlinkMutation.isPending}
                onConfirm={() => confirmUnlink && unlinkMutation.mutate(confirmUnlink)}
                onCancel={() => setConfirmUnlink(null)}
            />
        </div>
    );
};

// =============================================================================
// Main page
// =============================================================================

const StudentDetailPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate      = useNavigate();
    const location      = useLocation();
    const { hasRole }   = useAuth();

    const parsedStudentId = Number(studentId);

    // ── Tenant context from router state ────────────────────────────────────
    const locationState = (location.state ?? {}) as Partial<StudentDetailState>;
    const [schoolId, setSchoolId] = useState<number | undefined>(
        locationState.schoolId ? Number(locationState.schoolId) : undefined,
    );
    const [branchId, setBranchId] = useState<number | undefined>(
        locationState.branchId ? Number(locationState.branchId) : undefined,
    );

    // ── Role helpers ─────────────────────────────────────────────────────────
    const isSuperAdmin  = hasRole("SUPER_ADMIN");
    const isSchoolAdmin = hasRole("SCHOOL_ADMIN");
    const isBranchAdmin = hasRole("BRANCH_ADMIN");
    const canEdit       = isSuperAdmin || isSchoolAdmin || isBranchAdmin;

    // ── Tab state ────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<TabId>("details");

    // ── Local override for optimistic UI after inline edit ───────────────────
    const [localStudent, setLocalStudent] = useState<StudentResponse | null>(null);

    // ── Student query ────────────────────────────────────────────────────────
    const {
        data    : fetchedStudent,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["students", "detail", parsedStudentId, schoolId, branchId],
        queryFn : () => getStudent(parsedStudentId, schoolId!, branchId!),
        enabled : !!parsedStudentId && !!schoolId && !!branchId,
        staleTime: 60_000,
    });

    // Fallback: populate schoolId/branchId from the fetched student if the
    // user arrived via direct URL and location.state was empty.
    useEffect(() => {
        if (fetchedStudent) {
            if (!schoolId) setSchoolId(fetchedStudent.school_id);
            if (!branchId) setBranchId(fetchedStudent.branch_id);
        }
    }, [fetchedStudent, schoolId, branchId]);

    const queryClient = useQueryClient();

    // ── Deactivate mutation ──────────────────────────────────────────────────
    const deactivateMutation = useMutation({
        mutationFn: () =>
            deactivateStudent(parsedStudentId, schoolId!, branchId!),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({
                queryKey: ["students", "detail", parsedStudentId],
            });
            queryClient.invalidateQueries({ queryKey: ["students"] });
            setLocalStudent(updated);
            toast.success(
                updated.is_active ? "Student activated" : "Student deactivated",
            );
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.detail ?? "Failed to update student"),
    });

    const student = localStudent ?? fetchedStudent;

    // ── Loading / error ──────────────────────────────────────────────────────
    if (!schoolId || !branchId) {
        return (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
                <AlertCircle size={28} className="text-amber-400" />
                <p className="text-base font-semibold text-slate-700">
                    Tenant context missing
                </p>
                <p className="text-sm text-slate-400">
                    Navigate here from the Students list to load this student.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/students")}
                    className="mt-2 text-sm font-semibold text-emerald-500 hover:underline"
                >
                    Back to Students
                </button>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-base font-semibold text-slate-700">
                    Student not found
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/students")}
                    className="mt-2 text-sm font-semibold text-emerald-500 hover:underline"
                >
                    Back to Students
                </button>
            </div>
        );
    }

    // ── Tab config ───────────────────────────────────────────────────────────
    const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
        {
            id   : "details",
            label: "Details",
            icon : <GraduationCap size={14} strokeWidth={2} />,
        },
        {
            id   : "parents",
            label: "Parents",
            icon : <Users size={14} strokeWidth={2} />,
        },
        {
            id   : "leaves",
            label: "Leave Requests",
            icon : <CalendarOff size={14} strokeWidth={2} />,
        },
    ];

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-5">

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/students")}
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
                    aria-label="Back to Students"
                >
                    <ArrowLeft size={16} strokeWidth={2} />
                </button>

                <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
                    {isLoading || !student ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-6 w-48 rounded bg-slate-100" />
                            <div className="h-4 w-32 rounded bg-slate-100" />
                        </div>
                    ) : (
                        <>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Avatar */}
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-sm shadow-emerald-500/20">
                                        {student.first_name[0].toUpperCase()}
                                        {(student.last_name?.[0] ?? "").toUpperCase()}
                                    </div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-800">
                                        {[student.first_name, student.last_name]
                                            .filter(Boolean)
                                            .join(" ")}
                                    </h1>
                                    <StatusBadge active={student.is_active} />
                                </div>
                                <p className="mt-0.5 text-sm text-slate-400">
                                    {[
                                        student.grade    ? `Grade ${student.grade}` : null,
                                        student.section  ? `Section ${student.section}` : null,
                                        student.admission_number ?? null,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ") || "No grade / section assigned"}
                                </p>
                            </div>

                            {canEdit && (
                                <PageToggleButton
                                    isActive={student.is_active}
                                    label={
                                        student.is_active
                                            ? "Deactivate"
                                            : "Activate"
                                    }
                                    onClick={() => deactivateMutation.mutate()}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Tab bar ──────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={[
                                "flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm transition-all",
                                activeTab === tab.id
                                    ? "border-b-2 border-emerald-500 font-semibold text-emerald-600"
                                    : "text-slate-400 hover:text-slate-600",
                            ].join(" ")}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="p-6" role="tabpanel">
                    {isLoading || !student ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-12 rounded-xl bg-slate-100" />
                            ))}
                        </div>
                    ) : activeTab === "details" ? (
                        <StudentDetailsCard
                            student={student}
                            canEdit={canEdit}
                            onSaved={setLocalStudent}
                            schoolId={schoolId}
                            branchId={branchId}
                        />
                    ) : (
                        <ParentsTab
                            student={student}
                            schoolId={schoolId}
                            branchId={branchId}
                            canEdit={canEdit}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDetailPage;