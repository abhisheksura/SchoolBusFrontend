
import React from "react";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";

import { FormField } from "@/components/ui/form/FormField";
import { TextInput } from "@/components/ui/form/TextInput";
import { SubmitButton, CancelButton } from "@/components";
import type { StopResponse }       from "../types";

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

// =============================================================================
// Props
// =============================================================================

interface StopFormProps {
    /** Existing Stop when editing; omit or pass undefined for create mode. */
    stop    ?: StopResponse;
    onSubmit   : (data: StopFormData) => Promise<void>;
    onCancel   : () => void;
    isLoading ?: boolean;
}

export const StopForm: React.FC<StopFormProps> = ({
    stop,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const isEdit = !!stop;
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<StopFormData>({
        resolver: zodResolver(stopSchema),
        defaultValues: {
            stop_name       : stop?.stop_name       ?? "",
            latitude        : stop?.latitude,
            longitude       : stop?.longitude,
            is_active       : stop?.is_active       ?? true,
        },
    });
    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
        >
            <FormField
                label="Stop Name"
                required
                error={errors.stop_name?.message}
            >
                <TextInput
                    {...register("stop_name")}
                    type="text"
                    placeholder="e.g. KPHB IV Phase"
                    disabled={isLoading}
                    autoFocus={!isEdit}
                />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
                <FormField
                    label="Latitude"
                    error={errors.latitude?.message}
                >
                    <TextInput
                        {...register("latitude", { valueAsNumber: true })}
                        type="number"
                        step="any"
                        placeholder="e.g. 15.5"
                        disabled={isLoading}
                    />
                </FormField>
                <FormField
                    label="Longitude"
                    error={errors.longitude?.message}
                >
                    <TextInput
                        {...register("longitude", { valueAsNumber: true })}
                        type="number"
                        step="any"
                        placeholder="e.g. 72.5"
                        disabled={isLoading}
                    />
                </FormField>
            </div>
            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={isEdit ? "Update Stop" : "Create Stop"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>
        </form>
    );
};
export default StopForm;