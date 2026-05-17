// src/modules/routes/components/RouteForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Route } from '../types';

// Zod schema matching backend validation
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
    route?: Route;
    onSubmit: (data: RouteFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({
    route,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RouteFormData>({
        resolver: zodResolver(routeSchema),
        defaultValues: {
            route_code: route?.route_code || '',
            route_name: route?.route_name || '',
            is_active: route?.is_active ?? true,
        },
    });

    const inputClass = "flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Active Status (only show when editing) */}
            {route && (
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            {...register('is_active')}
                            type="checkbox"
                            className="w-4 h-4 rounded border-2 border-input text-primary focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                        />
                        <span className="text-sm font-medium text-foreground">
                            Active
                        </span>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                        Inactive routes cannot be used for new trips
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                >
                    {isLoading && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {route ? 'Update Route' : 'Create Route'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-xl border-2 border-border bg-background px-4 py-2.5 text-base font-semibold hover:bg-accent hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};