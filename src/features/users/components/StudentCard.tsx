// src/features/students/components/StudentCard.tsx
//
// Card representation of a single student.
// Follows the same structure as RouteCard and DriverCard:
//   • BaseCard wrapper with hover lift effect
//   • CardHeader — avatar initials + name + status badge
//   • Highlight band — grade / section context
//   • Meta rows — school, branch, admission number, created date
//   • CardFooter — Edit + Toggle active (canEdit guard)
//   • Clicking anywhere navigates to the student detail page

import React            from "react";
import { useNavigate }  from "react-router-dom";
import {
    GraduationCap,
    Building2,
    MapPin,
    Hash,
    Calendar,
    ArrowRight,
}                       from "lucide-react";

import {
    StatusBadge,
    CardEditButton,
    ToggleActiveButton,
    BaseCard,
    CardFooter,
    CardMetaRow,
}                       from "@/components";
import { formatDate }   from "@/core/utils/formatters";
import type { StudentResponse } from "../types";

// =============================================================================
// Props
// =============================================================================

export interface StudentCardProps {
    student    : StudentResponse;
    /** Show school + branch meta rows — true for SUPER_ADMIN and SCHOOL_ADMIN. */
    showSchool : boolean;
    canEdit    : boolean;
    onEdit     : (student: StudentResponse) => void;
    onToggle   : (student: StudentResponse) => void;
}

// =============================================================================
// Helpers
// =============================================================================

/** Build "Grade 5 · Section A" label from nullable fields. */
function buildGradeLabel(grade: string | null, section: string | null): string {
    const parts: string[] = [];
    if (grade)   parts.push(`Grade ${grade}`);
    if (section) parts.push(`Section ${section}`);
    return parts.join(" · ") || "No grade assigned";
}

/** Derive two uppercase initials from first + last name. */
function getInitials(firstName: string, lastName: string | null): string {
    const parts = [firstName, lastName].filter(Boolean) as string[];
    return parts.map((p) => p[0].toUpperCase()).join("");
}

// =============================================================================
// Component
// =============================================================================

/**
 * StudentCard
 *
 * Displays a student's key info in a scannable card layout.
 * Clicking the card navigates to /students/:id with school + branch
 * in router state so the detail page never needs to re-derive tenant context.
 */
export const StudentCard: React.FC<StudentCardProps> = ({
    student,
    showSchool,
    canEdit,
    onEdit,
    onToggle,
}) => {
    const navigate = useNavigate();

    const initials   = getInitials(student.first_name, student.last_name);
    const fullName   = [student.first_name, student.last_name]
        .filter(Boolean)
        .join(" ");
    const gradeLabel = buildGradeLabel(student.grade, student.section);

    /** Navigate to the student detail page, forwarding tenant context. */
    const goToDetail = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        console.log(
        `/students/${student.student_id}`
        );
        navigate(`/students/${student.student_id}`, {
            state: {
                breadcrumbLabel: fullName,
                schoolId       : student.school_id,
                branchId       : student.branch_id,
            },
        });
    };

    return (
        <BaseCard clickable onClick={goToDetail}>

            {/* ── Header: avatar + name + status ──────────────────────── */}
            <div className="flex items-start justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with initials */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-sm shadow-emerald-500/20">
                        {initials}
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                            {fullName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                            Student #{student.student_id}
                        </p>
                    </div>
                </div>

                <StatusBadge active={student.is_active} />
            </div>

            {/* ── Grade / section highlight band ───────────────────────── */}
            <div className="mx-5 mb-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5">
                    <GraduationCap
                        size={14}
                        className="text-emerald-500 shrink-0"
                    />
                    <p className="text-xs font-semibold text-emerald-700 truncate">
                        {gradeLabel}
                    </p>
                </div>
            </div>

            {/* ── Meta rows ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 px-5 pb-4">
                {student.admission_number && (
                    <CardMetaRow icon={<Hash size={11} />}>
                        Adm. {student.admission_number}
                    </CardMetaRow>
                )}

                {showSchool && (
                    <>
                        <CardMetaRow icon={<Building2 size={11} />}>
                            {/* school_name not on StudentResponse — show school_id */}
                            School #{student.school_id}
                        </CardMetaRow>
                        <CardMetaRow icon={<MapPin size={11} />}>
                            Branch #{student.branch_id}
                        </CardMetaRow>
                    </>
                )}

                <CardMetaRow icon={<Calendar size={11} />}>
                    Added {formatDate(student.created_at)}
                </CardMetaRow>
            </div>

            {/* ── View detail CTA ───────────────────────────────────────── */}
            <div className="mx-5 mb-4">
                <button
                    type="button"
                    onClick={goToDetail}
                    className={[
                        "flex w-full items-center justify-between",
                        "rounded-xl bg-emerald-50 border border-emerald-100",
                        "px-4 py-2.5",
                        "text-xs font-semibold text-emerald-600",
                        "hover:bg-emerald-100 hover:border-emerald-200 transition-colors",
                    ].join(" ")}
                >
                    <span>View detail &amp; parents</span>
                    <ArrowRight size={13} strokeWidth={2.5} />
                </button>
            </div>

            {/* ── Footer actions ────────────────────────────────────────── */}
            {canEdit && (
                <CardFooter>
                    <CardEditButton onClick={() => onEdit(student)} />
                    <div className="h-6 w-px bg-slate-100" />
                    <ToggleActiveButton
                        isActive={student.is_active}
                        onClick={() => onToggle(student)}
                    />
                </CardFooter>
            )}
        </BaseCard>
    );
};

export default StudentCard;