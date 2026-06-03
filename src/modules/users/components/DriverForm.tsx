// src/modules/users/components/DriverForm.tsx
// Slide-over form used for both creating and editing a Driver.
//
// Behaviour:
//   - editingDriver = null  → "Add Driver" mode (POST)
//   - editingDriver = Driver → "Edit Driver" mode  (PUT)
//
// Validation is handled client-side with Zod (mirrors backend Pydantic
// constraints exactly) and surfaced per-field via react-hook-form.
//
// The caller is responsible for wiring the mutation — this component
// simply calls onSubmit(values) with the validated form output.

import React from "react";
import { SubmitButton, CancelButton } from '@/components';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    X,
    Loader2,
    User,
    Phone,
    CreditCard,
    Building2,
    MapPin,
} from "lucide-react";
import type { DriverResponse, DriverCreateRequest, DriverUpdateRequest } from "../types";

// ---------------------------------------------------------------------------
// Zod schema — mirrors backend Pydantic model validation exactly
// ---------------------------------------------------------------------------

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

type DriverFormInput = z.input<typeof driverSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DriverFormProps {
    driver: DriverResponse | null;
    /**
     * Called with validated form values when the user submits.
     * The caller handles the actual mutation.
     */
    onSubmit: (data: DriverFormInput) => Promise<void>;
    /** Callback to close the panel without submitting. */
    onCancel: () => void;
    isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DriverForm: React.FC<DriverFormProps> = ({
    driver,
    onSubmit,
    onCancel,
    isLoading = false
}) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DriverFormInput>({
        resolver: zodResolver(driverSchema),
        // Populate fields when editing; clear them when creating
        values: driver
            ? {
                  first_name    : driver.first_name,
                  last_name     : driver.last_name     ?? "",
                  phone         : driver.phone         ?? "",
                  license_number: driver.license_number ?? "",
                  is_active     : driver.is_active,
              }
            : {
                  first_name    : "",
                  last_name     : "",
                  phone         : "",
                  license_number: "",
                  is_active     : true,
              },
    });
    const inputClass =
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-150 placeholder:text-slate-400 focus:border-yellow-400";

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
        >
            {/* Driver Name */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    First Name
                    <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                    {...register("first_name")}
                    type="text"
                    placeholder="e.g. Mark"
                    className={inputClass}
                    disabled={isLoading}
                    autoFocus
                />

                {errors.first_name && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.first_name .message}
                    </p>
                )}
            </div>
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Name
                    <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                    {...register("last_name")}
                    type="text"
                    placeholder="e.g. Zucker"
                    className={inputClass}
                    disabled={isLoading}
                    autoFocus
                />

                {errors.last_name && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.last_name .message}
                    </p>
                )}
            </div>

            {/* Phone */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                </label>

                <input
                    {...register("phone")}
                    type="tel"
                    placeholder="+91 98765 43210"
                    className={inputClass}
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
                    className={inputClass}
                    disabled={isLoading}
                />

                {errors.license_number && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.license_number.message}
                    </p>
                )}
            </div>

            {/* Active Toggle */}
            {driver && (
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
                                Active Driver
                            </p>

                            <p className="text-xs text-slate-500">
                                Inactive Driver cannot be assigned
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={driver ? "Update Driver" : "Create Driver"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />

            </div>
        </form>
    );
};

export default DriverForm;