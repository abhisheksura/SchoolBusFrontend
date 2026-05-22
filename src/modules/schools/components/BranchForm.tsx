// src/modules/schools/components/BranchForm.tsx

import React from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import type { BranchResponse } from "../types";

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

const branchSchema = z.object({
    branch_name: z
        .string()
        .min(1, "Branch name is required")
        .max(100, "Branch name too long"),

    branch_address: z
        .string()
        .max(200, "Address too long")
        .optional(),

    branch_phone: z
        .string()
        .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format")
        .max(20, "Phone number too long")
        .optional(),

    branch_email: z
        .string()
        .email("Invalid email address")
        .optional()
        .or(z.literal("")),

    is_active: z.boolean().optional(),
});

// Exported so BranchesListPage can type its mutation payloads
export type BranchFormData = z.infer<typeof branchSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface BranchFormProps {
    branch?: BranchResponse;
    onSubmit: (data: BranchFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const BranchForm: React.FC<BranchFormProps> = ({
    branch,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema),

        defaultValues: {
            branch_name: branch?.branch_name || "",
            branch_address: branch?.branch_address || "",
            branch_phone: branch?.branch_phone || "",
            branch_email: branch?.branch_email || "",
            is_active: branch?.is_active ?? true,
        },
    });

    const inputClass =
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-yellow-400";

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
        >
            {/* Branch Name */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Branch Name
                    <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                    {...register("branch_name")}
                    type="text"
                    placeholder="e.g. Main Campus"
                    className={inputClass}
                    disabled={isLoading}
                />

                {errors.branch_name && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.branch_name.message}
                    </p>
                )}
            </div>

            {/* Address */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Address
                </label>

                <textarea
                    {...register("branch_address")}
                    rows={3}
                    placeholder="Street, Area, City"
                    className={`${inputClass} resize-none`}
                    disabled={isLoading}
                />

                {errors.branch_address && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.branch_address.message}
                    </p>
                )}
            </div>

            {/* Phone */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                </label>

                <input
                    {...register("branch_phone")}
                    type="tel"
                    placeholder="+91 98765 43210"
                    className={inputClass}
                    disabled={isLoading}
                />

                {errors.branch_phone && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.branch_phone.message}
                    </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                    Include country code, e.g. +91 98765 43210
                </p>
            </div>

            {/* Email */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                </label>

                <input
                    {...register("branch_email")}
                    type="email"
                    placeholder="branch@school.edu"
                    className={inputClass}
                    disabled={isLoading}
                />

                {errors.branch_email && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.branch_email.message}
                    </p>
                )}
            </div>

            {/* Active Toggle */}
            {branch && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex items-center gap-3">
                        <input
                            {...register("is_active")}
                            type="checkbox"
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
                        />

                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                Active Branch
                            </p>

                            <p className="text-xs text-slate-500">
                                Inactive branches cannot be used
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-[#2D1F00] transition hover:bg-yellow-500 disabled:opacity-60"
                >
                    {isLoading && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                    {branch
                        ? "Update Branch"
                        : "Create Branch"}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};