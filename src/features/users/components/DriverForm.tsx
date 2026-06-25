
import React from "react";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";

import { FormField } from "@/components/ui/form/FormField";
import { TextInput } from "@/components/ui/form/TextInput";
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
            {/* ── Phone ──────────────────────────────────────────────── */}
            <FormField
                label="Phone"
                error={errors.phone?.message}
                hint="Include country code, e.g. +91 98765 43210"
            >
                <TextInput
                    {...register("phone")}
                    type="tel"
                    placeholder="+91 98765 43210"
                    disabled={isLoading}
                />
            </FormField>

            {/* ── License Number ─────────────────────────────────────── */}
            <FormField
                label="License Number"
                error={errors.license_number?.message}
            >
                <TextInput
                    {...register("license_number")}
                    type="text"
                    placeholder="License Number"
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