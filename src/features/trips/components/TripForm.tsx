// src/features/trips/components/TripForm.tsx
//
// Create form for a Trip.
// No edit mode — trips are immutable after creation.
// Status transitions happen via the action buttons on TripCard / TripDetailPage.
// Bus / driver assignment uses the separate AssignAssets panel, not this form.
//
// Validation mirrors backend TripCreate:
//   route_id     — required, positive integer (selected from dropdown)
//   service_date — required, ISO date
//   trip_type    — required, PICKUP | DROPOFF
//   bus_id       — optional, positive integer
//   driver_id    — optional, positive integer

import React         from "react";
import { useForm, Controller }   from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }          from "zod";
import { useQuery }   from "@tanstack/react-query";
import { Loader2 }             from "lucide-react";
import { SubmitButton, CancelButton } from "@/components";
import { FormField }                  from "@/components/ui/form/FormField";
import { TextInput }                  from "@/components/ui/form/TextInput";
import { getRoutes }                  from "@/features/routes/api";
import { getDrivers }                 from "@/features/users/api";
import { getBuses }                   from "@/features/buses/api";
import type { RouteResponse }         from "@/features/routes/types";
import type { DriverResponse }        from "@/features/users/types";
import type { BusResponse }           from "@/features/buses/types";
import type { TripCreateRequest }     from "../types";
import type { TripResponse }          from "../types";
import { TRIP_TYPE_LABELS }           from "../constants";


// =============================================================================
// Zod schema
// =============================================================================

const tripSchema = z.object({
    route_id    : z
        .number({ error: "Route is required" })
        .int()
        .positive("Route is required"),

    service_date: z
        .string()
        .min(1, "Service date is required")
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),

    trip_type   : z.enum(["PICKUP", "DROPOFF"], {
        error: () => ({ message: "Trip type is required" }),
    }),

    bus_id      : z
        .number()
        .int()
        .positive()
        .optional()
        .nullable(),

    driver_id   : z
        .number()
        .int()
        .positive()
        .optional()
        .nullable(),
});

export type TripFormData = z.infer<typeof tripSchema>;

const TRIP_TYPES = ["PICKUP", "DROPOFF"] as const;
 
const TRIP_TYPE_ACTIVE: Readonly<Record<(typeof TRIP_TYPES)[number], string>> = {
    PICKUP : "border-blue-500 bg-blue-50 text-blue-700",
    DROPOFF: "border-amber-500 bg-amber-50 text-amber-700",
};
// =============================================================================
// Props
// =============================================================================
interface TripFormProps {
    trip           ?: TripResponse;
    /** Dropdown data — already scoped to the school + branch by the page. */
    routes          : RouteResponse[];
    buses           : BusResponse[];
    drivers         : DriverResponse[];
    routesLoading  ?: boolean;
    busesLoading   ?: boolean;
    driversLoading ?: boolean;
    onSubmit        : (data: TripFormData) => Promise<void>;
    onCancel        : () => void;
    isLoading      ?: boolean;
}

// =============================================================================
// Styles
// =============================================================================

const SELECT =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 " +
    "text-sm text-slate-800 outline-none transition-all duration-150 " +
    "focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 " +
    "disabled:bg-slate-50 disabled:cursor-not-allowed";

const SELECT_ERR =
    "w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 " +
    "text-sm text-slate-800 outline-none focus:border-red-400 disabled:cursor-not-allowed";

const INPUT =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 " +
    "text-sm text-slate-800 outline-none transition-all duration-150 " +
    "focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 " +
    "disabled:bg-slate-50 disabled:cursor-not-allowed";

const INPUT_ERR =
    "w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 " +
    "text-sm text-slate-800 outline-none focus:border-red-400 disabled:cursor-not-allowed";

const LABEL =
    "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500";

// =============================================================================
// SelectField — labelled <select> bound to a number | null value.
//
// FormField is not used here: it injects `hasError` into its child, which a
// native <select> would forward to the DOM. An empty choice maps to `null`
// (never NaN), so optional fields validate when left blank.
// =============================================================================
 
interface SelectFieldProps {
    label     : string;
    value     : number | null | undefined;
    onChange  : (value: number | null) => void;
    children  : React.ReactNode;
    required ?: boolean;
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
    required = false,
    disabled = false,
    loading  = false,
    error,
    hint,
}) => (
    <div>
        <label className={LABEL}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <select
                value={value ?? ""}
                onChange={(e) =>
                    onChange(e.target.value === "" ? null : Number(e.target.value))
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
        {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
);
 
// =============================================================================
// Component
// =============================================================================

/**
 * TripForm
 *
 * Create-only form for scheduling a trip.
 * Route, bus, and driver dropdowns are all pre-filtered to the resolved
 * school + branch so users cannot assign cross-tenant assets.
 *
 * bus_id and driver_id are optional — they can be left blank and assigned
 * later via the "Assign Assets" action on the TripCard.
 */

export const TripForm: React.FC<TripFormProps> = ({
    trip,
    routes,
    buses,
    drivers,
    routesLoading   = false,
    busesLoading    = false,
    driversLoading  = false,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {

    const isEdit = !!trip;
 
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<TripFormData>({
        resolver: zodResolver(tripSchema),
        defaultValues: {
            route_id    : trip?.route_id,
            service_date: trip?.service_date ?? new Date().toISOString().slice(0, 10),
            // TripResponse.trip_type is typed as a plain string upstream.
            trip_type   : (trip?.trip_type as TripFormData["trip_type"] | undefined) ?? "PICKUP",
            bus_id      : trip?.bus_id       ?? null,
            driver_id   : trip?.driver_id    ?? null,
        },
    });

    const routeOptions  = routes.filter((r) => r.is_active  || r.route_id  === trip?.route_id);
    const busOptions    = buses.filter((b) => b.is_active   || b.bus_id    === trip?.bus_id);
    const driverOptions = drivers.filter((d) => d.is_active || d.driver_id === trip?.driver_id);
 
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* ── Trip Type (Pick-up / Drop-off) ─────────────────────── */}
            <div>
                <label className={LABEL}>
                    Trip Type <span className="text-red-500">*</span>
                </label>
                <Controller
                    name="trip_type"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2">
                            {TRIP_TYPES.map((type) => (
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
                                    {TRIP_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    )}
                />
                {errors.trip_type && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.trip_type.message}
                    </p>
                )}
            </div>

            {/* ── Route ──────────────────────────────────────────────── */}
            <Controller
                name="route_id"
                control={control}
                render={({ field }) => (
                    <SelectField
                        label="Route"
                        required
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? undefined)}
                        disabled={isLoading || routesLoading}
                        loading={routesLoading}
                        error={errors.route_id?.message}
                    >
                        <option value="">
                            {routesLoading ? "Loading routes…" : "Select a route"}
                        </option>
                        {routeOptions.map((r) => (
                            <option key={r.route_id} value={r.route_id}>
                                {r.route_code} — {r.route_name}
                            </option>
                        ))}
                    </SelectField>
                )}
            />

            {/* ── Service Date ───────────────────────────────────────── */}
            <FormField
                label="Service Date"
                required
                error={errors.service_date?.message}
            >
                <TextInput
                    {...register("service_date")}
                    type="date"
                    disabled={isLoading}
                />
            </FormField>
 
            {/* ── Bus (optional) ─────────────────────────────────────── */}
            <Controller
                name="bus_id"
                control={control}
                render={({ field }) => (
                    <SelectField
                        label="Bus (optional)"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading || busesLoading}
                        loading={busesLoading}
                    >
                        <option value="">
                            {busesLoading ? "Loading buses…" : "Assign later"}
                        </option>
                        {busOptions.map((b) => (
                            <option key={b.bus_id} value={b.bus_id}>
                                {b.bus_number} ({b.capacity} seats)
                            </option>
                        ))}
                    </SelectField>
                )}
            />
             {/* ── Driver (optional) ──────────────────────────────────── */}
            <Controller
                name="driver_id"
                control={control}
                render={({ field }) => (
                    <SelectField
                        label="Driver (optional)"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading || driversLoading}
                        loading={driversLoading}
                        hint="Bus and driver can also be assigned after scheduling."
                    >
                        <option value="">
                            {driversLoading ? "Loading drivers…" : "Assign later"}
                        </option>
                        {driverOptions.map((d) => (
                            <option key={d.driver_id} value={d.driver_id}>
                                {[d.first_name, d.last_name].filter(Boolean).join(" ")}
                            </option>
                        ))}
                    </SelectField>
                )}
            />
 
            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label={isEdit ? "Update Trip" : "Schedule Trip"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>
        </form>
    );
};

export const TripFormOld: React.FC<TripFormProps> = ({
    schoolId,
    branchId,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TripFormData>({
        resolver: zodResolver(tripSchema),
        defaultValues: {
            route_id    : undefined,
            service_date: new Date().toISOString().slice(0, 10),
            trip_type   : "PICKUP",
            bus_id      : null,
            driver_id   : null,
        },
    });

    // ── Dropdown data — all scoped to school + branch ──────────────────────

    const { data: routesData, isLoading: routesLoading } = useQuery({
        queryKey : ["routes", "dropdown", { schoolId, branchId }],
        queryFn  : () =>
            getRoutes({ school_id: schoolId, branch_id: branchId, active_only: true, page_size: 200 }),
        staleTime: 60_000,
    });

    const { data: busesData, isLoading: busesLoading } = useQuery({
        queryKey : ["buses", "dropdown", { schoolId, branchId }],
        queryFn  : () =>
            getBuses(schoolId, { branch_id: branchId, active_only: true, page_size: 200 }),
        staleTime: 60_000,
    });

    const { data: driversData, isLoading: driversLoading } = useQuery({
        queryKey : ["drivers", "dropdown", { schoolId, branchId }],
        queryFn  : () =>
            getDrivers({ school_id: schoolId, branch_id: branchId, is_active: true, page_size: 200 }),
        staleTime: 60_000,
    });

    const routes  = routesData?.items  ?? [];
    const buses   = busesData?.items   ?? [];
    const drivers = driversData?.items ?? [];

    // ── Submit ─────────────────────────────────────────────────────────────

    const handleFormSubmit = handleSubmit((data: TripFormData) => {
        onSubmit({
            school_id   : schoolId,
            branch_id   : branchId,
            route_id    : data.route_id,
            service_date: data.service_date,
            trip_type   : data.trip_type,
            bus_id      : data.bus_id    ?? null,
            driver_id   : data.driver_id ?? null,
        });
    });

    return (
        <form onSubmit={handleFormSubmit} className="space-y-5">

            {/* ── Route ──────────────────────────────────────────────── */}
            <div>
                <label className={LABEL}>
                    Route <span className="text-red-500">*</span>
                </label>
                <select
                    {...register("route_id", { valueAsNumber: true })}
                    disabled={isLoading || routesLoading}
                    className={errors.route_id ? SELECT_ERR : SELECT}
                >
                    <option value="">
                        {routesLoading ? "Loading routes…" : "Select a route"}
                    </option>
                    {routes.map((r) => (
                        <option key={r.route_id} value={r.route_id}>
                            {r.route_code} — {r.route_name}
                        </option>
                    ))}
                </select>
                {errors.route_id && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.route_id.message}
                    </p>
                )}
            </div>

            {/* ── Service Date + Trip Type (side by side) ────────────── */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={LABEL}>
                        Service Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register("service_date")}
                        type="date"
                        disabled={isLoading}
                        className={errors.service_date ? INPUT_ERR : INPUT}
                    />
                    {errors.service_date && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.service_date.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className={LABEL}>
                        Trip Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        {...register("trip_type")}
                        disabled={isLoading}
                        className={errors.trip_type ? SELECT_ERR : SELECT}
                    >
                        <option value="PICKUP">Pick-up</option>
                        <option value="DROPOFF">Drop-off</option>
                    </select>
                    {errors.trip_type && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.trip_type.message}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Bus (optional) ─────────────────────────────────────── */}
            <div>
                <label className={LABEL}>Bus (optional)</label>
                <select
                    {...register("bus_id", { valueAsNumber: true })}
                    disabled={isLoading || busesLoading}
                    className={SELECT}
                >
                    <option value="">
                        {busesLoading ? "Loading buses…" : "Assign later"}
                    </option>
                    {buses.map((b) => (
                        <option key={b.bus_id} value={b.bus_id}>
                            {b.bus_number} ({b.capacity} seats)
                        </option>
                    ))}
                </select>
            </div>

            {/* ── Driver (optional) ──────────────────────────────────── */}
            <div>
                <label className={LABEL}>Driver (optional)</label>
                <select
                    {...register("driver_id", { valueAsNumber: true })}
                    disabled={isLoading || driversLoading}
                    className={SELECT}
                >
                    <option value="">
                        {driversLoading ? "Loading drivers…" : "Assign later"}
                    </option>
                    {drivers.map((d) => (
                        <option key={d.driver_id} value={d.driver_id}>
                            {[d.first_name, d.last_name].filter(Boolean).join(" ")}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                    Bus and driver can also be assigned after scheduling.
                </p>
            </div>

            {/* ── Actions ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <SubmitButton
                    label="Schedule Trip"
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>

        </form>
    );
};

export default TripForm;