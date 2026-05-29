// src/modules/routes/components/StopForm.tsx

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SubmitButton, CancelButton } from "@/core/components/ui";
import type { StopResponse } from "../types";
import { TenantSelector } from "@/core/components/tenant/TenantSelectors";
import { useTenantOptions }             from "@/tenant/hooks/useTenantOptions";
import { TenantReadOnly } from "@/core/components/tenant/TenantReadOnly";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const stopSchema = z.object({
    stop_name: z.string().min(1).max(100),

    latitude: z
        .number()
        .min(-90, "Latitude must be ≥ -90")
        .max(90, "Latitude must be ≤ 90"),

    longitude: z
        .number()
        .min(-180, "Longitude must be ≥ -180")
        .max(180, "Longitude must be ≤ 180"),

    is_active: z.boolean().optional(),
    school_id : z.number().optional(),
    branch_id : z.number().optional(),
});
export type StopFormData = z.infer<typeof stopSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StopFormProps {
    mode: "create" | "edit";
    /**
    * Pass the FULL StopResponse when editing.
    * Used for:
    *   • pre-filling all form fields (via `values` prop — reactive)
    *   • showing the read-only tenant panel (school_name, branch_name)
    * Pass undefined in create mode.
    */

    stop         ?: StopResponse;
    initialValues?: Partial<StopFormData>;

    onSubmit: (data: StopFormData) => void;

    onCancel: () => void;

    isLoading?: boolean;
    tenantScope: any;
    
    tenant?: {
        isEditing: boolean;
        schoolLabel: string;
        branchLabel: string;

        schoolOptions: any[];
        branchOptions: any[];

        tenantScope: any;
        isFetching: boolean;

        onSchoolChange: (id: number) => void;
    };

}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StopForm: React.FC<StopFormProps> = ({
    mode,
    stop,
    initialValues,
    onSubmit,
    onCancel,
    isLoading = false,
    tenantScope,
}) => {

    const isEdit = mode === "edit";
    const isCreate = mode === "create";

    // useTenantOptions handles:
    //   - fetching school/branch option lists for selectors
    //   - resolving display names for the read-only edit panel
    //   - all three role modes (editable / school_locked / fully_locked)
    const tenant = useTenantOptions({
        // entitySchoolId: stop?.school_id,
        // entityBranchId: stop?.branch_id,
    });

    // -----------------------------
    // Stable default values
    // -----------------------------
    const defaultValues = useMemo<StopFormData>(() => ({
        stop_name: initialValues?.stop_name ?? "",
        latitude: initialValues?.latitude ?? 17.385,
        longitude: initialValues?.longitude ?? 78.4867,
        is_active: initialValues?.is_active ?? true,
        // Important for edit mode (especially with TenantReadOnly)
        school_id: initialValues?.school_id,
        branch_id: initialValues?.branch_id,
    }), [initialValues]);

    // -----------------------------
    // React Hook Form
    // -----------------------------
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<StopFormData>({
        resolver: zodResolver(stopSchema),
        defaultValues,
    });

    const isActiveValue = watch("is_active");

    // -----------------------------
    // Submit handler (stable)
    // -----------------------------
    const submitHandler = useMemo(
        () => handleSubmit((data) => onSubmit(data)),
        [handleSubmit, onSubmit]
    );

    // -----------------------------
    // Styles (memoized to avoid re-creation)
    // -----------------------------
    const styles = useMemo(() => ({
        input:
            "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm " +
            "text-slate-800 outline-none transition-all duration-150 " +
            "placeholder:text-slate-400 focus:border-yellow-400",

        inputError:
            "w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 text-sm " +
            "text-slate-800 outline-none transition-all duration-150 " +
            "placeholder:text-slate-400 focus:border-red-400",

        label:
            "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500",
    }), []);

    // const showTenantSelectors = tenant && !tenant.isEditing;

    // ---------------------------------------------------------------------------
    // UI
    // ---------------------------------------------------------------------------

    return (
        <form onSubmit={submitHandler} className="space-y-5">
            {isEdit ? (
                <>
                <TenantReadOnly
                        schoolName={
                            stop?.school_name
                                ?? (stop?.school_id ? `School #${stop.school_id}` : "—")
                        }
                        branchName={
                            stop?.branch_name
                                ?? (stop?.branch_id ? `Branch #${stop.branch_id}` : "—")
                        }
                    />
                    <input
                        type="hidden"
                        {...register("school_id", { valueAsNumber: true })}
                    />
                    <input
                        type="hidden"
                        {...register("branch_id", { valueAsNumber: true })}
                    />
                </>
            ) : (
                <TenantSelector
                    register={register}
                    setValue={setValue}
                    tenantScope={tenantScope}
                    tenant={tenant}
                    errors={errors}
                    inputClass={styles.input}
                    inputErrorClass={styles.inputError}
                    labelClass={styles.label}
                />
            )}
            {/* Stop Name */}
            <div>
                <label className={styles.label}>
                    Stop Name <span className="text-red-500">*</span>
                </label>

                <input
                    {...register("stop_name")}
                    type="text"
                    placeholder="e.g. Jubilee Hills Check Post"
                    className={errors.stop_name ? styles.inputError : styles.input}
                    disabled={isLoading}
                    autoFocus={mode === "create"}
                />

                {errors.stop_name && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.stop_name.message}
                    </p>
                )}
            </div>

            {/* Coordinates */}
            <div>
                <label className={styles.label}>
                    GPS Coordinates <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">

                    <div>
                        <p className="mb-1 text-[11px] text-slate-400">Latitude</p>
                        <input
                            {...register("latitude")}
                            type="number"
                            step="any"
                            className={errors.latitude ? styles.inputError : styles.input}
                            disabled={isLoading}
                        />
                        {errors.latitude && (
                            <p className="mt-1 text-[11px] text-red-500">
                                {errors.latitude.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="mb-1 text-[11px] text-slate-400">Longitude</p>
                        <input
                            {...register("longitude")}
                            type="number"
                            step="any"
                            className={errors.longitude ? styles.inputError : styles.input}
                            disabled={isLoading}
                        />
                        {errors.longitude && (
                            <p className="mt-1 text-[11px] text-red-500">
                                {errors.longitude.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Active toggle */}
            {mode === "edit" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">

                        <input
                            type="checkbox"
                            checked={isActiveValue ?? true}
                            onChange={(e) =>
                                setValue("is_active", e.target.checked, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                            disabled={isLoading}
                            className="h-4 w-4"
                        />

                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                Active Stop
                            </p>
                            <p className="text-xs text-slate-500">
                                Inactive stops cannot be used in routes
                            </p>
                        </div>

                    </label>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={mode === "edit" ? "Update Stop" : "Add Stop"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>

        </form>
    );
};

export default StopForm;