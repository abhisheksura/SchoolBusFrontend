// src/features/students/components/ParentForm.tsx
//
// Create / edit form for a Parent record.
//
// Validation mirrors backend ParentCreate / ParentUpdate exactly:
//   first_name      — required, max 100
//   last_name       — optional, max 100
//   phone           — optional, 7-20 chars, digits/spaces/+/-/()/
//   alternate_phone — same pattern as phone
//   email           — optional, valid email format
//   address         — optional, max 500
//   is_active       — boolean toggle (edit mode only)
//   user_id         — required on create only (positive integer)
//
// Rendered inside <EntityModal /> — mutation is the caller's concern.

import React          from "react";
import { useForm }    from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }          from "zod";

import { SubmitButton, CancelButton } from "@/components";
import type { ParentResponse }        from "../types";

// =============================================================================
// Zod schema — mirrors backend ParentCreate / ParentUpdate exactly
// =============================================================================

/** Phone regex matches backend: 7–20 chars, digits/spaces/+/-/() allowed. */
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

const parentSchema = z.object({
    first_name: z
        .string()
        .min(1, "First name is required")
        .max(100, "Must be 100 characters or fewer"),

    last_name: z
        .string()
        .max(100, "Must be 100 characters or fewer")
        .optional()
        .or(z.literal("")),

    phone: z
        .string()
        .regex(PHONE_REGEX, "7–20 chars; digits, spaces, +, -, ( ) only")
        .optional()
        .or(z.literal("")),

    alternate_phone: z
        .string()
        .regex(PHONE_REGEX, "7–20 chars; digits, spaces, +, -, ( ) only")
        .optional()
        .or(z.literal("")),

    email: z
        .string()
        .email("Must be a valid email address")
        .optional()
        .or(z.literal("")),

    address: z
        .string()
        .max(500, "Must be 500 characters or fewer")
        .optional()
        .or(z.literal("")),

    /** Only shown + validated in create mode. */
    user_id: z
        .number({ error: "User ID must be a number" })
        .int("Must be an integer")
        .positive("Must be a positive number")
        .optional(),

    is_active: z.boolean().optional(),
});

export type ParentFormData = z.infer<typeof parentSchema>;

// =============================================================================
// Props
// =============================================================================

interface ParentFormProps {
    /** Existing parent when editing; omit or pass undefined for create mode. */
    parent    ?: ParentResponse;
    onSubmit   : (data: ParentFormData) => Promise<void>;
    onCancel   : () => void;
    isLoading ?: boolean;
}

// =============================================================================
// Styles
// =============================================================================

const INPUT =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 " +
    "text-sm text-slate-800 outline-none transition-all duration-150 " +
    "placeholder:text-slate-400 focus:border-emerald-400 " +
    "focus:ring-2 focus:ring-emerald-500/20 " +
    "disabled:bg-slate-50 disabled:cursor-not-allowed";

const INPUT_ERR =
    "w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 " +
    "text-sm text-slate-800 outline-none transition-all duration-150 " +
    "placeholder:text-slate-400 focus:border-red-400 disabled:cursor-not-allowed";

const LABEL =
    "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500";

// =============================================================================
// Component
// =============================================================================

/**
 * ParentForm
 *
 * Dual-mode form — create when `parent` is undefined, edit when provided.
 * In create mode: user_id field visible (required).
 * In edit mode  : is_active toggle visible; user_id hidden (immutable).
 */
export const ParentForm: React.FC<ParentFormProps> = ({
    parent,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const isEdit = !!parent;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ParentFormData>({
        resolver: zodResolver(parentSchema),
        defaultValues: {
            first_name     : parent?.first_name      ?? "",
            last_name      : parent?.last_name       ?? "",
            phone          : parent?.phone           ?? "",
            alternate_phone: parent?.alternate_phone ?? "",
            email          : parent?.email           ?? "",
            address        : parent?.address         ?? "",
            user_id        : undefined,
            is_active      : parent?.is_active       ?? true,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Name row ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={LABEL}>
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register("first_name")}
                        type="text"
                        placeholder="e.g. Rajesh"
                        disabled={isLoading}
                        autoFocus={!isEdit}
                        className={errors.first_name ? INPUT_ERR : INPUT}
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
                        placeholder="e.g. Kumar"
                        disabled={isLoading}
                        className={errors.last_name ? INPUT_ERR : INPUT}
                    />
                    {errors.last_name && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.last_name.message}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Phone row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={LABEL}>Phone</label>
                    <input
                        {...register("phone")}
                        type="tel"
                        placeholder="+91 98765 43210"
                        disabled={isLoading}
                        className={errors.phone ? INPUT_ERR : INPUT}
                    />
                    {errors.phone && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.phone.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className={LABEL}>Alternate Phone</label>
                    <input
                        {...register("alternate_phone")}
                        type="tel"
                        placeholder="+91 98765 43210"
                        disabled={isLoading}
                        className={errors.alternate_phone ? INPUT_ERR : INPUT}
                    />
                    {errors.alternate_phone && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.alternate_phone.message}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Email ──────────────────────────────────────────────── */}
            <div>
                <label className={LABEL}>Email</label>
                <input
                    {...register("email")}
                    type="email"
                    placeholder="parent@example.com"
                    disabled={isLoading}
                    className={errors.email ? INPUT_ERR : INPUT}
                />
                {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {/* ── Address ────────────────────────────────────────────── */}
            <div>
                <label className={LABEL}>Address</label>
                <textarea
                    {...register("address")}
                    rows={2}
                    placeholder="Street, Area, City"
                    disabled={isLoading}
                    className={`${errors.address ? INPUT_ERR : INPUT} resize-none`}
                />
                {errors.address && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.address.message}
                    </p>
                )}
            </div>

            {/* ── User ID — create mode only ─────────────────────────── */}
            {!isEdit && (
                <div>
                    <label className={LABEL}>
                        User ID <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register("user_id", { valueAsNumber: true })}
                        type="number"
                        min={1}
                        placeholder="Platform user account ID"
                        disabled={isLoading}
                        className={errors.user_id ? INPUT_ERR : INPUT}
                    />
                    {errors.user_id ? (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.user_id.message}
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-slate-400">
                            The parent must already have a platform user account.
                        </p>
                    )}
                </div>
            )}

            {/* ── Active toggle — edit mode only ─────────────────────── */}
            {isEdit && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            {...register("is_active")}
                            type="checkbox"
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                        />
                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                Active Parent
                            </p>
                            <p className="text-xs text-slate-500">
                                Inactive parents cannot receive notifications
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={isEdit ? "Update Parent" : "Add Parent"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>

        </form>
    );
};

export default ParentForm;