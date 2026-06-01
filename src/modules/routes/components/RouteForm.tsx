// src/modules/routes/components/RouteForm.tsx

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SubmitButton, CancelButton } from "@/components/";
import { TenantSelector } from "@/tenant/components/TenantSelectors";
import { useTenantOptions }             from "@/tenant/hooks/useTenantOptions";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const routeSchema = z.object({
    route_code: z.string()
        .min(1, 'Route code is required')
        .max(20, 'Route code too long')
        .regex(/^[A-Z0-9-]+$/, 'Route code must be uppercase letters, numbers, or hyphens'),
    route_name: z.string()
        .min(1, 'Route name is required')
        .max(100, 'Route name too long'),
    is_active: z.boolean().optional(),
});

type RouteFormData = z.infer<typeof routeSchema>;

interface RouteFormProps {
    mode: "create" | "edit";

    initialValues?: Partial<RouteFormData>;

    onSubmit: (data: RouteFormData) => void;

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

export const RouteForm: React.FC<RouteFormProps> = ({
    mode,
    initialValues,
    onSubmit,
    onCancel,
    isLoading = false,
    tenantScope,
}) => {

    // useTenantOptions handles:
    //   - fetching school/branch option lists for selectors
    //   - resolving display names for the read-only edit panel
    //   - all three role modes (editable / school_locked / fully_locked)
    const tenant = useTenantOptions({
        // entitySchoolId: stop?.school_id,
        // entityBranchId: stop?.branch_id,
    });

    const defaultValues = useMemo<RouteFormData>(() => ({
            route_code: initialValues?.route_code || '',
            route_name: initialValues?.route_name || '',
            is_active: initialValues?.is_active ?? true,
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
    } = useForm<RouteFormData>({
        resolver: zodResolver(routeSchema),
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

    // ---------------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------------
 
    const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm " +
    "text-slate-800 outline-none transition-all duration-150 " +
    "placeholder:text-slate-400 focus:border-yellow-400";
 
    const inputErrorClass =
    "w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 text-sm " +
    "text-slate-800 outline-none transition-all duration-150 " +
    "placeholder:text-slate-400 focus:border-red-400";

    const labelClass =
    "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500";

    return (
        <form onSubmit={submitHandler} className="space-y-5">
            <TenantSelector
                register={register} 
                setValue={setValue}
                tenantScope={tenantScope}
                tenant={tenant}
                errors={errors}
                inputClass={inputClass}
                inputErrorClass={inputErrorClass}
                labelClass={labelClass}
            />
            {/* Route Code */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Route Code <span className="text-red-600">*</span>
                </label>
                <input
                    {...register('route_code')}
                    type="text"
                    className={inputClass}
                    placeholder="e.g., RT-001, NORTH-A"
                    disabled={isLoading}
                    style={{ textTransform: 'uppercase' }}
                />
                {errors.route_code && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.route_code.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                    Use uppercase letters, numbers, and hyphens only
                </p>
            </div>

            {/* Route Name */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Route Name <span className="text-red-600">*</span>
                </label>
                <input
                    {...register('route_name')}
                    type="text"
                    className={inputClass}
                    placeholder="e.g., North Zone Morning Route"
                    disabled={isLoading}
                />
                {errors.route_name && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.route_name.message}</p>
                )}
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
                                Active Route
                            </p>
                            <p className="text-xs text-slate-500">
                                Inactive Route cannot be used in routes
                            </p>
                        </div>

                    </label>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={mode === "edit" ? "Update Route" : "Add Route"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>
        </form>
    );
};