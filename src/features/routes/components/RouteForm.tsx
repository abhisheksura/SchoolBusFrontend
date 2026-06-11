// src/modules/routes/components/RouteForm.tsx
//
// Create / edit form for a Route.
//
// Validation mirrors backend Pydantic RouteCreate / RouteUpdate:
//   route_code — 1–20 chars, uppercase letters / numbers / hyphens only
//   route_name — 1–100 chars, free text
//   is_active  — boolean toggle (edit mode only)
//
// Always rendered inside <EntityModal />.
// Calls onSubmit() with validated values — mutation is the caller's concern.

import React from "react";
import { useForm }         from "react-hook-form";
import { zodResolver }     from "@hookform/resolvers/zod";
import { z }               from "zod";

import { SubmitButton, CancelButton } from "@/components";
import type { RouteResponse }         from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────

const routeSchema = z.object({
    route_code: z
        .string()
        .min(1, "Route code is required")
        .max(20, "Must be 20 characters or fewer")
        .regex(
            /^[A-Z0-9-]+$/,
            "Uppercase letters, numbers, and hyphens only",
        ),
    route_name: z
        .string()
        .min(1, "Route name is required")
        .max(100, "Must be 100 characters or fewer"),
    is_active: z.boolean().optional(),
});

export type RouteFormData = z.infer<typeof routeSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface RouteFormProps {
    /** Existing route when editing; omit for create mode. */
    route     ?: RouteResponse;
    onSubmit   : (data: RouteFormData) => Promise<void>;
    onCancel   : () => void;
    isLoading ?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles (defined once, referenced below)
// ─────────────────────────────────────────────────────────────────────────────

const INPUT =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 " +
    "text-sm text-slate-800 outline-none transition-all duration-150 " +
    "placeholder:text-slate-400 focus:border-indigo-400 " +
    "focus:ring-2 focus:ring-indigo-500/20 " +
    "disabled:bg-slate-50 disabled:cursor-not-allowed";

const INPUT_ERR =
    "w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 " +
    "text-sm text-slate-800 outline-none transition-all duration-150 " +
    "placeholder:text-slate-400 focus:border-red-400 disabled:cursor-not-allowed";

const LABEL =
    "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RouteForm
 *
 * Dual-mode form — create when `route` is undefined, edit when provided.
 * In edit mode the is_active toggle is shown.
 *
 * @param route     — pre-fills form in edit mode
 * @param onSubmit  — receives validated data
 * @param onCancel  — closes the modal
 * @param isLoading — disables inputs + shows spinner
 */
export const RouteForm: React.FC<RouteFormProps> = ({
    route,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const isEdit = !!route;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RouteFormData>({
        resolver: zodResolver(routeSchema),
        defaultValues: {
            route_code: route?.route_code ?? "",
            route_name: route?.route_name ?? "",
            is_active : route?.is_active  ?? true,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* ── Route Code ───────────────────────────────────────────────── */}
            <div>
                <label className={LABEL}>
                    Route Code <span className="text-red-500">*</span>
                </label>
                <input
                    {...register("route_code")}
                    type="text"
                    placeholder="e.g. RT-001 or NORTH-A"
                    disabled={isLoading}
                    onInput={(e) => {
                        // Auto-uppercase so the user never has to think about it
                        e.currentTarget.value = e.currentTarget.value.toUpperCase();
                    }}
                    className={errors.route_code ? INPUT_ERR : INPUT}
                />
                {errors.route_code ? (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.route_code.message}
                    </p>
                ) : (
                    <p className="mt-1 text-xs text-slate-400">
                        Uppercase letters, numbers, and hyphens — e.g. RT-001
                    </p>
                )}
            </div>

            {/* ── Route Name ───────────────────────────────────────────────── */}
            <div>
                <label className={LABEL}>
                    Route Name <span className="text-red-500">*</span>
                </label>
                <input
                    {...register("route_name")}
                    type="text"
                    placeholder="e.g. North Zone Morning Route"
                    disabled={isLoading}
                    className={errors.route_name ? INPUT_ERR : INPUT}
                />
                {errors.route_name && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.route_name.message}
                    </p>
                )}
            </div>

            {/* ── Active toggle — edit mode only ───────────────────────────── */}
            {isEdit && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            {...register("is_active")}
                            type="checkbox"
                            disabled={isLoading}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                        />
                        <div>
                            <p className="text-sm font-semibold text-slate-700">
                                Active Route
                            </p>
                            <p className="text-xs text-slate-500">
                                Inactive routes cannot be assigned to new trips
                            </p>
                        </div>
                    </label>
                </div>
            )}

            {/* ── Actions ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={isEdit ? "Update Route" : "Create Route"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>
        </form>
    );
};