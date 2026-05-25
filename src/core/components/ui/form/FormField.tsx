// src/core/components/ui/form/FormField

import React from "react";

interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    hint?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    error,
    required,
    children,
    hint,
}) => {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>

            {children}

            {hint && !error && (
                <p className="text-xs text-slate-400">{hint}</p>
            )}

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};