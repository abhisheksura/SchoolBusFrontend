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
import { useForm }   from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }          from "zod";
import { useQuery }   from "@tanstack/react-query";

import { SubmitButton, CancelButton } from "@/components";
import { getRoutes }                  from "@/features/routes/api";
import { getDrivers }                 from "@/features/users/api";
import { getBuses }                   from "@/modules/buses/api";
import type { TripCreateRequest }     from "../types";

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

// =============================================================================
// Props
// =============================================================================

interface TripFormProps {
    /** Resolved tenant ids — required to scope the route / bus / driver dropdowns. */
    schoolId  : number;
    branchId  : number;
    onSubmit  : (data: TripCreateRequest) => Promise<void>;
    onCancel  : () => void;
    isLoading?: boolean;
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