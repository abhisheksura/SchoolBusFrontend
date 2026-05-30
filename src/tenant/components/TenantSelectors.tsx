// src/core/components/tenant/TenantSelectors.tsx

import React, { useEffect } from "react";

import type {
    FieldErrors,
    FieldValues,
    Path,
    PathValue,
    UseFormRegister,
    UseFormSetValue,
} from "react-hook-form";
import type {
    TenantScope,
} from "@/tenant/hooks/useTenantScope";

import { useTenantOptions } from "@/tenant/hooks/useTenantOptions";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SelectOption {
    label: string;
    value: number;
}

/**
 * Any form using TenantSelectors MUST contain these fields.
 */
interface TenantFields extends FieldValues {
    school_id?: number;
    branch_id?: number;
}

type TenantOptions = ReturnType<typeof useTenantOptions>;

interface Props<TFormValue extends TenantFields> {
    register:UseFormRegister<TFormValue>;
    setValue: UseFormSetValue<TFormValue>;
    tenantScope: TenantScope;
    tenant: TenantOptions;  
    errors: FieldErrors<TFormValue>;
    inputClass: string;
    inputErrorClass: string;
    labelClass: string;
}
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TenantSelector<
    TFormValue extends TenantFields
>({
    register,
    setValue,
    tenantScope,
    tenant,
    errors,
    inputClass,
    inputErrorClass,
    labelClass
}: Props<TFormValue>) {
    
    const { schoolOptions, branchOptions, onSchoolChange } = tenant;

    const handleSchoolChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const val = e.target.value;

        setValue(
            "branch_id" as Path<TFormValue>,
            undefined as PathValue<
                TFormValue,
                Path<TFormValue>
            >
        );

        onSchoolChange?.(
            val ? Number(val) : undefined
        );
    };

    // school_admin OR branch_admin
    const readonlySchool =
        tenantScope.accessLevel === "school_locked" ||
        tenantScope.accessLevel === "fully_locked";

    // branch_admin only
    const readonlyBranch =
        tenantScope.accessLevel === "fully_locked";

    const resolvedSchoolOptions =
        readonlySchool &&
        tenantScope.schoolId
            ? [
                {
                    value:
                        tenantScope.schoolId,

                    label:
                        tenantScope.schoolName ??
                        `School #${tenantScope.schoolId}`,
                },
            ]
            : schoolOptions;

    const resolvedBranchOptions =
        readonlyBranch &&
        tenantScope.branchId
            ? [
                {
                    value:
                        tenantScope.branchId,

                    label:
                        tenantScope.branchName ??
                        `Branch #${tenantScope.branchId}`,
                },
            ]
            : branchOptions;
    // -----------------------------------------------------------------------
    // Auto-set school_id from JWT tenant scope
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (
            readonlySchool &&
            tenantScope.schoolId
        ) {
            setValue(
                "school_id" as Path<TFormValue>,
                tenantScope.schoolId as any
            );
        }
    }, [
        readonlySchool,
        tenantScope.schoolId,
        setValue,
    ]);

    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className={labelClass}>
                    School<span className="ml-1 text-red-500">*</span>
                </label>
                <select 
                    {...register(
                        "school_id" as Path<TFormValue>,
                        {
                            valueAsNumber: true,
                        }
                    )}
                    defaultValue={tenantScope.schoolId ?? ""}
                    className={
                        errors.school_id
                            ? inputErrorClass
                            : inputClass
                    }
                    disabled={readonlySchool}
                    onChange={handleSchoolChange}
                >
                    <option value="">Select School</option>
                    {resolvedSchoolOptions.map((s) => (
                        <option
                            key={s.value}
                            value={s.value}
                        >
                            {s.label}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className={labelClass}>
                    Branch<span className="ml-1 text-red-500">*</span>
                </label>
                <select
                    className={
                        errors.branch_id
                            ? inputErrorClass
                            : inputClass
                        }
                    disabled={readonlyBranch}
                >
                    <option value="">Select Branch</option>
                    {resolvedBranchOptions.map((b) => (
                        <option
                            key={b.value}
                            value={b.value}
                        >
                            {b.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};