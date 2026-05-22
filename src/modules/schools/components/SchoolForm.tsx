// src/modules/schools/components/SchoolForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SchoolResponse } from '../types';
import { defaultShouldDehydrateMutation } from '@tanstack/react-query';

// Zod schema matching backend validation
const schoolSchema = z.object({
    school_name: z.string().min(1, 'School name is required').max(100, 'School name too long'),
    is_active: z.boolean().optional(),
});

export type SchoolFormData = z.infer<typeof schoolSchema>;

interface SchoolFormProps {
    school?: SchoolResponse;
    onSubmit: (data: SchoolFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const SchoolForm: React.FC<SchoolFormProps> = ({
    school,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SchoolFormData>({
        resolver: zodResolver(schoolSchema),
        defaultValues: {
            school_name: school?.school_name || '',
            is_active: school?.is_active ?? true,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* School Name */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    School Name <span className="text-red-600">*</span>
                </label>
                <input
                    {...register('school_name')}
                    type="text"
                    className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    placeholder="Enter school name"
                    disabled={isLoading}
                />
                {errors.school_name && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.school_name.message}</p>
                )}
            </div>

            {/* Active Status (only show when editing) */}
            {school && (
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
                        Inactive schools cannot be used for new operations
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-[#2D1F00] transition hover:bg-yellow-500 disabled:opacity-60"
                >
                    {isLoading && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {school ? 'Update School' : 'Create School'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-base font-semibold hover:bg-accent hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default SchoolForm;