// src/features/buses/components/BusForm.tsx
//
// Create / edit form for a Bus.
//
// Validation mirrors backend Pydantic BusCreate / BusUpdate:
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
import type { BusResponse }       from "../types";

// =============================================================================
// Zod schema — mirrors backend BusCreate / BusUpdate exactly
// =============================================================================

const busSchema = z.object({
    bus_number: z
        .string()
        .min(1, "Bus Number is required")
        .regex(
            /^[A-Z0-9-]+$/,
            "Uppercase letters, numbers, and hyphens only",
        ),
    capacity: z
        .number()
        .min(2)
        .max(100),
    is_active: z.boolean().optional(),
});

export type BusFormData = z.infer<typeof busSchema>;

// =============================================================================
// Props
// =============================================================================

interface BusFormProps {
    /** Existing bus when editing; omit or pass undefined for create mode. */
    bus       ?: BusResponse;
    onSubmit   : (data: BusFormData) => Promise<void>;
    onCancel   : () => void;
    isLoading ?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * BusForm
 *
 * Dual-mode form — create when `bus` is undefined, edit when provided.
 * In create mode the user_id field is shown (required for backend).
 * In edit mode the is_active toggle is shown; user_id is hidden (immutable).
 *
 * @param bus    — pre-fills form in edit mode
 * @param onSubmit   — receives validated data; caller handles mutation
 * @param onCancel   — closes the modal without submitting
 * @param isLoading  — disables inputs + shows spinner on submit button
 */
export const BusForm: React.FC<BusFormProps> = ({
    bus,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const isEdit = !!bus;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BusFormData>({
        resolver: zodResolver(busSchema),
        defaultValues: {
            bus_number      : bus?.bus_number       ?? "",
            capacity        : bus?.capacity,
            is_active       : bus?.is_active        ?? true,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">


            {/* ── Bus Number ──────────────────────────────────────────── */}
            <FormField
                label="Bus Number"
                error={errors.bus_number?.message}
            >
                <TextInput
                    {...register("bus_number")}
                    type="text"
                    placeholder="e.g. TS-09-UB-1001"
                    disabled={isLoading}
                />
            </FormField>

            {/* ── Capacity ───────────────────────────────────── */}
            <FormField
                label="Capacity"
                error={errors.capacity?.message}
            >
                <TextInput
                    {...register("capacity",{valueAsNumber: true})}
                    type="number"
                    placeholder="e.g. 50"
                    disabled={isLoading}
                    
                />
            </FormField>

            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={isEdit ? "Update Bus" : "Create Bus"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>

        </form>
    );
};

export default BusForm;