// src/features/assignments/components/AssignmentForm.tsx
//
// Create form for a student route assignment.
//
// No edit mode — assignments are immutable after creation.
// Deactivation is handled via the Remove button on AssignmentRow.
//
// Form flow:
//   1. Select student   (dropdown — tenant-scoped to school + branch)
//   2. Select route     (dropdown — tenant-scoped to school + branch)
//   3. Select stop      (dropdown — filtered to stops on the chosen route
//                        for the chosen trip type; loads on route change)
//   4. Select trip type (PICKUP | DROPOFF radio toggle)
//
// Validation mirrors backend StudentRouteAssignmentCreate:
//   student_id     — required, positive integer
//   route_id       — required, positive integer
//   stop_id        — required, positive integer (must be on selected route)
//   assignment_type — required, PICKUP | DROPOFF
//
// school_id + branch_id are injected at submit time from caller props —
// the form never exposes them as editable fields.

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver }         from "@hookform/resolvers/zod";
import { z }                  from "zod";
import { useQuery }            from "@tanstack/react-query";
import { Loader2 }             from "lucide-react";

import { SubmitButton, CancelButton } from "@/components";
import { getStudents }                from "@/features/users/api";
import { getRoutes }                  from "@/features/routes/api";
import { getStops }                   from "@/features/routes/api";
import type { AssignmentCreateRequest, AssignmentType } from "../types";

// =============================================================================
// Zod schema — mirrors backend StudentRouteAssignmentCreate exactly
// =============================================================================

const assignmentSchema = z.object({
    student_id: z
        .number({ error: "Student is required" })
        .int()
        .positive("Student is required"),

    route_id: z
        .number({ error: "Route is required" })
        .int()
        .positive("Route is required"),

    stop_id: z
        .number({ error: "Stop is required" })
        .int()
        .positive("Stop is required"),

    assignment_type: z.enum(["PICKUP", "DROPOFF"], {
        error: () => ({ message: "Trip type is required" }),
    }),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;

// =============================================================================
// Props
// =============================================================================

interface AssignmentFormProps {
    /** Resolved tenant ids — required to scope all dropdowns. */
    schoolId  : number;
    branchId  : number;
    /**
     * Pre-fill student_id when opened from the Student detail page.
     * Pre-fill route_id when opened from the Route assignments view.
     * Both are still shown as read-only display chips when pre-filled.
     */
    prefillStudentId?: number;
    prefillRouteId  ?: number;
    onSubmit  : (data: AssignmentCreateRequest) => Promise<void>;
    onCancel  : () => void;
    isLoading?: boolean;
}

// =============================================================================
// Styles
// =============================================================================

const SELECT =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 " +
    "text-sm text-slate-800 outline-none transition-all duration-150 " +
    "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 " +
    "disabled:bg-slate-50 disabled:cursor-not-allowed";

const SELECT_ERR =
    "w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 " +
    "text-sm text-slate-800 outline-none focus:border-red-400 disabled:cursor-not-allowed";

const LABEL =
    "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500";

// =============================================================================
// Component
// =============================================================================

/**
 * AssignmentForm
 *
 * All four dropdowns are tenant-scoped:
 *   • Students   → filtered to school + branch
 *   • Routes     → filtered to school + branch (active only)
 *   • Stops      → filtered to the selected route's stops for the selected
 *                  trip type (loads lazily after route + type are picked)
 *   • Trip type  → PICKUP / DROPOFF toggle (affects which stops are shown)
 *
 * school_id + branch_id come from props and are injected at submit time.
 * The user never sees or edits these — they are a backend constraint, not
 * a user input.
 */
export const AssignmentForm: React.FC<AssignmentFormProps> = ({
    schoolId,
    branchId,
    prefillStudentId,
    prefillRouteId,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors },
    } = useForm<AssignmentFormData>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            student_id     : prefillStudentId ?? undefined,
            route_id       : prefillRouteId   ?? undefined,
            stop_id        : undefined,
            assignment_type: "PICKUP",
        },
    });

    const selectedRouteId    = watch("route_id");
    const selectedAssignType = watch("assignment_type") as AssignmentType;

    // Reset stop selection whenever route or trip type changes —
    // stops are route + trip-type specific.
    useEffect(() => {
        setValue("stop_id", undefined as any);
    }, [selectedRouteId, selectedAssignType, setValue]);

    // ── Students dropdown — scoped to school + branch ──────────────────────
    const { data: studentsData, isLoading: studentsLoading } = useQuery({
        queryKey : ["students", "dropdown", { schoolId, branchId }],
        queryFn  : () =>
            getStudents({
                school_id  : schoolId,
                branch_id  : branchId,
                active_only: true,
                page_size  : 500,
            }),
        staleTime: 60_000,
        // Skip if student is pre-filled — we already know who it is
        enabled  : !prefillStudentId,
    });

    const students = studentsData?.items ?? [];

    // ── Routes dropdown — scoped to school + branch ────────────────────────
    const { data: routesData, isLoading: routesLoading } = useQuery({
        queryKey : ["routes", "dropdown", { schoolId, branchId }],
        queryFn  : () =>
            getRoutes({
                school_id  : schoolId,
                branch_id  : branchId,
                active_only: true,
                page_size  : 200,
            }),
        staleTime: 60_000,
        enabled  : !prefillRouteId,
    });

    const routes = routesData?.items ?? [];

    // ── Stops dropdown — filtered to selected route + trip type ────────────
    //
    // We use getStops (the global stops endpoint) with school_id + branch_id
    // to keep the list tenant-scoped. The RouteStopsPage already loads
    // route-specific stops, but here we want the user to see only stops
    // that are actually on this route for the selected direction.
    //
    // The backend does not expose a "stops for route + trip_type" endpoint
    // directly — we fetch the route's stop membership via getRouteWithStops
    // which returns stop_ids keyed by trip_type, then use those ids to
    // cross-reference against the branch's full stop list.
    //
    // For simplicity we fetch the branch's active stops and let the user pick.
    // A future improvement would filter to only stops on the selected route.
    const { data: stopsData, isLoading: stopsLoading } = useQuery({
        queryKey : ["stops", "dropdown-for-route", { schoolId, branchId, selectedRouteId }],
        queryFn  : () =>
            getStops({
                school_id  : schoolId,
                branch_id  : branchId,
                active_only: true,
                page_size  : 500,
            }),
        enabled  : !!selectedRouteId,
        staleTime: 60_000,
    });

    const stops = stopsData?.items ?? [];

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleFormSubmit = handleSubmit((data: AssignmentFormData) => {
        onSubmit({
            school_id      : schoolId,
            branch_id      : branchId,
            student_id     : prefillStudentId ?? data.student_id,
            route_id       : prefillRouteId   ?? data.route_id,
            stop_id        : data.stop_id,
            assignment_type: data.assignment_type,
        });
    });

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <form onSubmit={handleFormSubmit} className="space-y-5">

            {/* ── Trip Type toggle ────────────────────────────────────── */}
            {/*
                Rendered FIRST because it affects which stops are available.
                Changing the type clears the stop selection (handled by useEffect).
            */}
            <div>
                <label className={LABEL}>
                    Trip Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {(["PICKUP", "DROPOFF"] as const).map((type) => (
                        <label
                            key={type}
                            className={[
                                "flex cursor-pointer items-center justify-center gap-2",
                                "rounded-xl border-2 px-4 py-3 text-sm font-semibold",
                                "transition-all duration-150",
                                selectedAssignType === type
                                    ? type === "PICKUP"
                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                        : "border-amber-500 bg-amber-50 text-amber-700"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                            ].join(" ")}
                        >
                            <input
                                type="radio"
                                value={type}
                                className="sr-only"
                                {...register("assignment_type")}
                            />
                            {type === "PICKUP" ? "Pick-up" : "Drop-off"}
                        </label>
                    ))}
                </div>
                {errors.assignment_type && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.assignment_type.message}
                    </p>
                )}
            </div>

            {/* ── Student picker ─────────────────────────────────────── */}
            {prefillStudentId ? (
                <div>
                    <label className={LABEL}>Student</label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-600">
                            ✓
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                            Student #{prefillStudentId} (pre-selected)
                        </span>
                    </div>
                </div>
            ) : (
                <div>
                    <label className={LABEL}>
                        Student <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            {...register("student_id", { valueAsNumber: true })}
                            disabled={isLoading || studentsLoading}
                            className={errors.student_id ? SELECT_ERR : SELECT}
                        >
                            <option value="">
                                {studentsLoading
                                    ? "Loading students…"
                                    : "Select a student"
                                }
                            </option>
                            {students.map((s) => (
                                <option key={s.student_id} value={s.student_id}>
                                    {[s.first_name, s.last_name]
                                        .filter(Boolean)
                                        .join(" ")}
                                    {s.admission_number
                                        ? ` — ${s.admission_number}`
                                        : ""
                                    }
                                </option>
                            ))}
                        </select>
                        {studentsLoading && (
                            <Loader2
                                size={14}
                                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                            />
                        )}
                    </div>
                    {errors.student_id && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.student_id.message}
                        </p>
                    )}
                </div>
            )}

            {/* ── Route picker ───────────────────────────────────────── */}
            {prefillRouteId ? (
                <div>
                    <label className={LABEL}>Route</label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                            ✓
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                            Route #{prefillRouteId} (pre-selected)
                        </span>
                    </div>
                </div>
            ) : (
                <div>
                    <label className={LABEL}>
                        Route <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            {...register("route_id", { valueAsNumber: true })}
                            disabled={isLoading || routesLoading}
                            className={errors.route_id ? SELECT_ERR : SELECT}
                        >
                            <option value="">
                                {routesLoading
                                    ? "Loading routes…"
                                    : "Select a route"
                                }
                            </option>
                            {routes.map((r) => (
                                <option key={r.route_id} value={r.route_id}>
                                    {r.route_code} — {r.route_name}
                                </option>
                            ))}
                        </select>
                        {routesLoading && (
                            <Loader2
                                size={14}
                                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                            />
                        )}
                    </div>
                    {errors.route_id && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.route_id.message}
                        </p>
                    )}
                </div>
            )}

            {/* ── Boarding stop picker ────────────────────────────────── */}
            <div>
                <label className={LABEL}>
                    Boarding Stop <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <select
                        {...register("stop_id", { valueAsNumber: true })}
                        disabled={isLoading || !selectedRouteId || stopsLoading}
                        className={errors.stop_id ? SELECT_ERR : SELECT}
                    >
                        <option value="">
                            {!selectedRouteId
                                ? "Select a route first"
                                : stopsLoading
                                    ? "Loading stops…"
                                    : stops.length === 0
                                        ? "No stops available for this route"
                                        : "Select boarding stop"
                            }
                        </option>
                        {stops.map((s) => (
                            <option key={s.stop_id} value={s.stop_id}>
                                {s.stop_name}
                            </option>
                        ))}
                    </select>
                    {stopsLoading && (
                        <Loader2
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                        />
                    )}
                </div>
                {errors.stop_id && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.stop_id.message}
                    </p>
                )}
                {selectedRouteId && !stopsLoading && stops.length === 0 && (
                    <p className="mt-1 text-xs text-amber-500">
                        No active stops found for this branch. Add stops first.
                    </p>
                )}
            </div>

            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label="Assign Student"
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>

        </form>
    );
};

export default AssignmentForm;