
import React from "react";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";

import { SubmitButton, CancelButton } from "@/components";
import type { DriverResponse }       from "../types";

const driverSchema = z.object({
    first_name: z
        .string()
        .min(1, "First name is required")
        .max(50, "First name must be 50 characters or fewer"),

    last_name: z
        .string()
        .max(50, "Last name must be 50 characters or fewer")
        .optional()
        .or(z.literal("")),

    phone: z
        .string()
        .regex(
            /^[0-9+\-\s()]*$/,
            "Phone may only contain digits, +, -, spaces, and parentheses",
        )
        .max(20, "Phone must be 20 characters or fewer")
        .optional()
        .or(z.literal("")),

    license_number: z
        .string()
        .max(30, "License number must be 30 characters or fewer")
        .optional()
        .or(z.literal("")),

    is_active: z.boolean().optional(),
});

export type DriverFormData = z.input<typeof driverSchema>;
// =============================================================================
// Props
// =============================================================================
// =============================================================================
// Styles (defined once — same pattern as RouteForm)
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

interface DriverFormProps {
    /** Existing driver when editing; omit or pass undefined for create mode. */
    driver    ?: DriverResponse;
    onSubmit   : (data: DriverFormData) => Promise<void>;
    onCancel   : () => void;
    isLoading ?: boolean;
}
export const DriverForm: React.FC<DriverFormProps> = ({
    driver,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const isEdit = !!driver;
    
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<DriverFormData>({
        resolver: zodResolver(driverSchema),
        defaultValues: {
            first_name      : driver?.first_name       ?? "",
            last_name       : driver?.last_name        ?? "",
            phone           : driver?.phone            ?? "",
            license_number  : driver?.license_number   ?? "",
            is_active       : driver?.is_active        ?? true,
        },
    });
    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
        >
            {/* ── First Name ─────────────────────────────────────────── */}
            <div>
                <label className={LABEL}>
                    First Name <span className="text-red-500">*</span>
                </label>
                <input
                    {...register("first_name")}
                    type="text"
                    placeholder="e.g. Arjun"
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
            {/* ── Last Name ──────────────────────────────────────────── */}
            <div>
                <label className={LABEL}>Last Name</label>
                <input
                    {...register("last_name")}
                    type="text"
                    placeholder="e.g. Sharma"
                    disabled={isLoading}
                    className={errors.last_name ? INPUT_ERR : INPUT}
                />
                {errors.last_name && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.last_name.message}
                    </p>
                )}
            </div>
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                </label>

                <input
                    {...register("phone")}
                    type="tel"
                    placeholder="+91 98765 43210"
                    className={errors.phone ? INPUT_ERR : INPUT}
                    disabled={isLoading}
                />

                {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.phone.message}
                    </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                    Include country code, e.g. +91 98765 43210
                </p>
            </div>

            {/* License Number */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    license_number
                </label>

                <input
                    {...register("license_number")}
                    type="text"
                    placeholder="License Number"
                    className={errors.license_number ? INPUT_ERR : INPUT}
                    disabled={isLoading}
                />

                {errors.license_number && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.license_number.message}
                    </p>
                )}
            </div>

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
                                Active Driver
                            </p>
                            <p className="text-xs text-slate-500">
                                Inactive Drivers
                            </p>
                        </div>
                    </label>
                </div>
            )}
            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={isEdit ? "Update Driver" : "Create Driver"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>
        </form>
    );
};
export default DriverForm;