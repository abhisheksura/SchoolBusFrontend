// src/modules/schools/components/SchoolForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SchoolResponse } from '../types';
import { SubmitButton, CancelButton } from '@/components';

import { defaultShouldDehydrateMutation } from '@tanstack/react-query';

// ==================== Zod Schema ====================
// Mirrors backend SchoolCreate / SchoolUpdate Pydantic models exactly.
const schoolSchema = z.object({
    school_name: z.string().min(1, 'School name is required').max(100, 'School name too long'),
    is_active: z.boolean().optional(),
});

export type SchoolFormData = z.infer<typeof schoolSchema>;

// ==================== Props ====================

interface SchoolFormProps {
    school?: SchoolResponse; // undefined = create mode, defined = edit mode
    onSubmit: (data: SchoolFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

// ==================== Component ====================

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
                            className="w-4 h-4 rounded border border-input text-primary focus:ring-2 focus:ring-primary"
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
                <SubmitButton
                    label={school ? "Update School" : "Create School"}
                    isLoading={isLoading}
                />
                <CancelButton onClick={onCancel} disabled={isLoading} />
            </div>
        </form>
    );
};

export default SchoolForm;