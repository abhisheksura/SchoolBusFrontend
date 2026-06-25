// src/features/students/components/StudentForm.tsx
//
// Create / edit form for a Student.
//
// Validation mirrors backend Pydantic StudentCreate / StudentUpdate:
//   first_name       — 1–100 chars, required
//   last_name        — optional, max 100
//   admission_number — optional, max 50
//   grade            — optional, max 20
//   section          — optional, max 10
//   is_active        — boolean toggle (edit mode only)
//   user_id          — assigned later during onboarding (not part of form)
//
// Always rendered inside <EntityModal />.
// Calls onSubmit() with validated values — mutation is the caller's concern.

import React from "react";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";

import { FormField } from "@/components/ui/form/FormField";
import { TextInput } from "@/components/ui/form/TextInput";
import { SubmitButton, CancelButton } from "@/components";
import type { StudentResponse }       from "../types";

// =============================================================================
// Zod schema — mirrors backend StudentCreate / StudentUpdate exactly
// =============================================================================

const studentSchema = z.object({
    first_name: z
        .string()
        .min(1, "First name is required")
        .max(100, "Must be 100 characters or fewer"),

    last_name: z
        .string()
        .max(100, "Must be 100 characters or fewer")
        .optional()
        .or(z.literal("")),

    admission_number: z
        .string()
        .max(50, "Must be 50 characters or fewer")
        .optional()
        .or(z.literal("")),

    grade: z
        .string()
        .max(20, "Must be 20 characters or fewer")
        .optional()
        .or(z.literal("")),

    section: z
        .string()
        .max(10, "Must be 10 characters or fewer")
        .optional()
        .or(z.literal("")),

    is_active: z.boolean().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;

// =============================================================================
// Props
// =============================================================================

interface StudentFormProps {
    /** Existing student when editing; omit or pass undefined for create mode. */
    student   ?: StudentResponse;
    onSubmit   : (data: StudentFormData) => Promise<void>;
    onCancel   : () => void;
    isLoading ?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * StudentForm
 *
 * Dual-mode form — create when `student` is undefined, edit when provided.
 * In create mode the user_id field is shown (required for backend).
 * In edit mode the is_active toggle is shown; user_id is hidden (immutable).
 *
 * @param student    — pre-fills form in edit mode
 * @param onSubmit   — receives validated data; caller handles mutation
 * @param onCancel   — closes the modal without submitting
 * @param isLoading  — disables inputs + shows spinner on submit button
 */
export const StudentForm: React.FC<StudentFormProps> = ({
    student,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const isEdit = !!student;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            first_name      : student?.first_name       ?? "",
            last_name       : student?.last_name        ?? "",
            admission_number: student?.admission_number ?? "",
            grade           : student?.grade            ?? "",
            section         : student?.section          ?? "",
            is_active       : student?.is_active        ?? true,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── First Name ─────────────────────────────────────────── */}
            <FormField
                label="First Name"
                required
                error={errors.first_name?.message}
            >
                <TextInput
                    {...register("first_name")}
                    type="text"
                    placeholder="e.g. Arjun"
                    disabled={isLoading}
                    autoFocus={!isEdit}
                />
            </FormField>

            {/* ── Last Name ──────────────────────────────────────────── */}
            <FormField
                label="Last Name"
                error={errors.last_name?.message}
            >
                <TextInput
                    {...register("last_name")}
                    type="text"
                    placeholder="e.g. Sharma"
                    disabled={isLoading}
                />
            </FormField>

            {/* ── Grade + Section (side by side) ─────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <FormField
                    label="Grade"
                    error={errors.grade?.message}
                >
                    <TextInput
                        {...register("grade")}
                        type="text"
                        placeholder="e.g. 5"
                        disabled={isLoading}
                    />
                </FormField>

                <FormField
                    label="Section"
                    error={errors.section?.message}
                >
                    <TextInput
                        {...register("section")}
                        type="text"
                        placeholder="e.g. A"
                        disabled={isLoading}
                    />
                </FormField>
            </div>

            {/* ── Admission Number ───────────────────────────────────── */}
            <FormField
                label="Admission Number"
                error={errors.admission_number?.message}
            >
                <TextInput
                    {...register("admission_number")}
                    type="text"
                    placeholder="e.g. ADM-2024-001"
                    disabled={isLoading}
                />
            </FormField>

            {/* ── Active toggle — edit mode only ─────────────────────── */}
            {isEdit && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            {...register("is_active")}
                            type="checkbox"
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
                        />
                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                Active Student
                            </p>
                            <p className="text-xs text-slate-500">
                                Inactive students will not appear in trip attendance
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={isEdit ? "Update Student" : "Create Student"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>

        </form>
    );
};

export default StudentForm;