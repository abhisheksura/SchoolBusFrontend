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

import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver }         from "@hookform/resolvers/zod";
import { z }                  from "zod";
import { Loader2 }             from "lucide-react";

import { SubmitButton, CancelButton } from "@/components";
import type { StudentResponse }       from "@/features/users/types";
import type { RouteResponse, RouteStop } from "@/features/routes/types";
import { useQuery }            from "@tanstack/react-query";
import { getStudents }                from "@/features/users/api";
import { getRoutes }                  from "@/features/routes/api";
import { getStops }                   from "@/features/routes/api";
import type { AssignmentCreateRequest, AssignmentResponse, AssignmentType } from "../types";

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
// Constants
// =============================================================================

const ASSIGNMENT_TYPES: readonly AssignmentType[] = ["PICKUP", "DROPOFF"];

const TRIP_TYPE_LABEL: Readonly<Record<AssignmentType, string>> = {
    PICKUP : "Pick-up",
    DROPOFF: "Drop-off",
};

const TRIP_TYPE_ACTIVE: Readonly<Record<AssignmentType, string>> = {
    PICKUP : "border-blue-500 bg-blue-50 text-blue-700",
    DROPOFF: "border-amber-500 bg-amber-50 text-amber-700",
};

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
// SelectField — labelled <select> with loading spinner + error / hint text.
//
// FormField is not used here: it injects `hasError` into its child, which a
// native <select> would forward to the DOM.
// =============================================================================

interface SelectFieldProps {
    label     : string;
    value     : number | undefined;
    onChange  : (value: number | undefined) => void;
    children  : React.ReactNode;
    disabled ?: boolean;
    loading  ?: boolean;
    error    ?: string;
    hint     ?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
    label,
    value,
    onChange,
    children,
    disabled = false,
    loading  = false,
    error,
    hint,
}) => (
    <div>
        <label className={LABEL}>
            {label} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
            <select
                value={value ?? ""}
                onChange={(e) =>
                    onChange(
                        e.target.value === "" ? undefined : Number(e.target.value),
                    )
                }
                disabled={disabled}
                className={error ? SELECT_ERR : SELECT}
            >
                {children}
            </select>
            {loading && (
                <Loader2
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                />
            )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-amber-500">{hint}</p>}
    </div>
);

// =============================================================================
// Props
// =============================================================================
interface AssignmentFormNewProps {
    assignment ?: AssignmentResponse;
    //schoolId    : number;
    // branchId    : number;
        /** Dropdown data — already scoped to the school + branch by the page. */
    students         : StudentResponse[];
    routes           : RouteResponse[];
    /** Stops (both trip types) of the currently selected route. */
    stops            : RouteStop[];
    studentsLoading ?: boolean;
    routesLoading   ?: boolean;
    stopsLoading    ?: boolean;
    /** Reports the selected route so the page can load its stops. */
    onRouteChange   ?: (routeId: number | undefined) => void;
    onSubmit   : (data: AssignmentFormData) => Promise<void>;
    onCancel   : () => void;
    isLoading ?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * AssignmentForm
 *
 * Dual-mode form — create when `assignment` is undefined, edit when provided.
 * All dropdowns are scoped to the resolved school + branch so users cannot
 * assign across tenants. The stop list is narrowed further to the stops on the
 * selected route for the selected trip type.
 *
 * @param assignment — pre-fills form in edit mode
 * @param schoolId   — tenant scope for the dropdowns
 * @param branchId   — tenant scope for the dropdowns
 * @param onSubmit   — receives validated data; caller handles mutation
 * @param onCancel   — closes the modal without submitting
 * @param isLoading  — disables inputs + shows spinner on submit button
 **/



export const AssignmentFormNew: React.FC<AssignmentFormNewProps> = ({
    assignment,
    students,
    routes,
    stops: routeStops,
    studentsLoading = false,
    routesLoading   = false,
    stopsLoading    = false,
    onRouteChange,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {

    const isEdit = !!assignment;

    const {
        handleSubmit,
        watch,
        resetField,
        control,
        formState: { errors },
    } = useForm<AssignmentFormData>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            student_id     : assignment?.student_id,
            route_id       : assignment?.route_id,
            stop_id        : assignment?.stop_id,
            assignment_type: assignment?.assignment_type ?? "PICKUP",
        },
    });

    const selectedRouteId = watch("route_id");
    const selectedType    = watch("assignment_type");

    // Stops belong to one route + one trip type, so clear the stop when the
    // user changes either. The ref makes the first render a no-op — otherwise
    // edit mode would wipe the stop it just pre-filled.
    const previous = useRef({
        routeId: assignment?.route_id,
        type   : assignment?.assignment_type ?? "PICKUP",
    });

    // Let the page know which route is selected so it can load that route's
    // stops. Fires on mount too, so edit mode loads the saved route's stops.
    useEffect(() => {
        onRouteChange?.(selectedRouteId);
    }, [selectedRouteId, onRouteChange]);

    // Only the stops of the selected trip type are offered.
    const stops = routeStops.filter((rs) => rs.trip_type === selectedType);

    // In edit mode the saved student / route / stop can be missing from the
    // lists (inactive route, stop removed from the route, student past the page
    // limit). Keep them selectable so the form never blanks a saved value.
    const showSavedStudent =
        !!assignment &&
        !students.some((s) => s.student_id === assignment.student_id);
    const showSavedRoute =
        !!assignment &&
        !routes.some((r) => r.route_id === assignment.route_id);
    const showSavedStop =
        !!assignment &&
        selectedRouteId === assignment.route_id &&
        selectedType    === assignment.assignment_type &&
        !stopsLoading &&
        !stops.some((s) => s.stop_id === assignment.stop_id);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* ── Trip Type ───────────────────────────────────────────── */}
            {/* First, because it decides which stops are offered. */}
            <div>
                <label className={LABEL}>
                    Trip Type <span className="text-red-500">*</span>
                </label>
                <Controller
                    name="assignment_type"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2">
                            {ASSIGNMENT_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => field.onChange(type)}
                                    className={[
                                        "flex items-center justify-center gap-2 rounded-xl",
                                        "border-2 px-4 py-3 text-sm font-semibold",
                                        "transition-all duration-150 disabled:cursor-not-allowed",
                                        field.value === type
                                            ? TRIP_TYPE_ACTIVE[type]
                                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                                    ].join(" ")}
                                >
                                    {TRIP_TYPE_LABEL[type]}
                                </button>
                            ))}
                        </div>
                    )}
                />
                {errors.assignment_type && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.assignment_type.message}
                    </p>
                )}
            </div>

            {/* ── Student ─────────────────────────────────────────────── */}
            <Controller
                name="student_id"
                control={control}
                render={({ field }) => (
                    <SelectField
                        label="Student"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading || studentsLoading}
                        loading={studentsLoading}
                        error={errors.student_id?.message}
                    >
                        <option value="">
                            {studentsLoading ? "Loading Students…" : "Select a Student"}
                        </option>
                        {showSavedStudent && (
                            <option value={assignment.student_id}>
                                {[assignment.student.first_name, assignment.student.last_name]
                                    .filter(Boolean)
                                    .join(" ")}
                            </option>
                        )}
                        {students.map((s) => (
                            <option key={s.student_id} value={s.student_id}>
                                {[s.first_name, s.last_name].filter(Boolean).join(" ")}
                                {s.admission_number ? ` — ${s.admission_number}` : ""}
                            </option>
                        ))}
                    </SelectField>
                )}
            />


            {/* ── Route ───────────────────────────────────────────────── */}
            <Controller
                name="route_id"
                control={control}
                render={({ field }) => (
                    <SelectField
                        label="Route"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading || routesLoading}
                        loading={routesLoading}
                        error={errors.route_id?.message}
                    >
                        <option value="">
                            {routesLoading ? "Loading Routes…" : "Select a Route"}
                        </option>
                        {showSavedRoute && (
                            <option value={assignment.route_id}>
                                {assignment.route_name}
                            </option>
                        )}
                        {routes.map((r) => (
                            <option key={r.route_id} value={r.route_id}>
                                {r.route_code} — {r.route_name}
                            </option>
                        ))}
                    </SelectField>
                )}
            />

            {/* ── Boarding Stop ───────────────────────────────────────── */}
            <Controller
                name="stop_id"
                control={control}
                render={({ field }) => (
                    <SelectField
                        label="Boarding Stop"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading || selectedRouteId === undefined || stopsLoading}
                        loading={stopsLoading && selectedRouteId !== undefined}
                        error={errors.stop_id?.message}
                        hint={
                            selectedRouteId !== undefined && !stopsLoading && stops.length === 0
                                ? "This route has no stops for the selected trip type. " +
                                  "Add stops to the route first."
                                : undefined
                        }
                    >
                        <option value="">
                            {selectedRouteId === undefined
                                ? "Please Select a Route first"
                                : stopsLoading
                                    ? "Loading Stops…"
                                    : stops.length === 0
                                        ? "No Stops available"
                                        : "Select Boarding Stop"}
                        </option>
                        {showSavedStop && (
                            <option value={assignment.stop_id}>
                                {assignment.stop_name}
                            </option>
                        )}
                        {stops.map((s) => (
                            <option key={s.route_stop_id} value={s.stop_id}>
                                {s.stop_sequence}. {s.stop_name}
                            </option>
                        ))}
                    </SelectField>
                )}
            />

            {/* ── Actions ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={isEdit ? "Update Assignment" : "Create Assignment"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>
        </form>
    );
}