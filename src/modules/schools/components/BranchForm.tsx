// src/modules/schools/components/BranchForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Branch } from '../types';

// Zod schema matching backend validation
const branchSchema = z.object({
    branch_name: z.string().min(1, 'Branch name is required').max(100, 'Branch name too long'),
    branch_address: z.string().max(200, 'Address too long').optional(),
    branch_phone: z.string()
        .regex(/^[0-9+\-\s()]*$/, 'Invalid phone number format')
        .max(20, 'Phone number too long')
        .optional(),
    branch_email: z.string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),
    is_active: z.boolean().optional(),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface BranchFormProps {
    branch?: Branch;
    onSubmit: (data: BranchFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const BranchForm: React.FC<BranchFormProps> = ({
    branch,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            branch_name: branch?.branch_name || '',
            branch_address: branch?.branch_address || '',
            branch_phone: branch?.branch_phone || '',
            branch_email: branch?.branch_email || '',
            is_active: branch?.is_active ?? true,
        },
    });

    const inputClass = "flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Branch Name */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Branch Name <span className="text-red-600">*</span>
                </label>
                <input
                    {...register('branch_name')}
                    type="text"
                    className={inputClass}
                    placeholder="Enter branch name"
                    disabled={isLoading}
                />
                {errors.branch_name && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.branch_name.message}</p>
                )}
            </div>

            {/* Address */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Address
                </label>
                <textarea
                    {...register('branch_address')}
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Enter branch address"
                    disabled={isLoading}
                    rows={3}
                />
                {errors.branch_address && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.branch_address.message}</p>
                )}
            </div>

            {/* Phone */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Phone Number
                </label>
                <input
                    {...register('branch_phone')}
                    type="tel"
                    className={inputClass}
                    placeholder="+91 98765 43210"
                    disabled={isLoading}
                />
                {errors.branch_phone && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.branch_phone.message}</p>
                )}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                    Email Address
                </label>
                <input
                    {...register('branch_email')}
                    type="email"
                    className={inputClass}
                    placeholder="branch@school.com"
                    disabled={isLoading}
                />
                {errors.branch_email && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.branch_email.message}</p>
                )}
            </div>

            {/* Active Status (only show when editing) */}
            {branch && (
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
                        Inactive branches cannot be used for new operations
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
                    {branch ? 'Update Branch' : 'Create Branch'}
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