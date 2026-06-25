// src/core/components/ui/form/FormField

import React from "react";

const LABEL_CLASSES = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactElement;
    hint?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    error,
    required,
    children,
    hint,
}) => {
    const hasError = !!error;

    // Automatically inject the error state into the child input component
    const renderChild = () => {
        if (React.isValidElement(children)) {
            const childProps = children.props as Record<string, any>;
            return React.cloneElement(children, {
                hasError: hasError || childProps.hasError,
            } as React.HTMLAttributes<HTMLElement> & { hasError?: boolean });
        }
        return children;
    };

    return (
        <div className="space-y-1">
            <label className={LABEL_CLASSES}>
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>

            {renderChild()}

            {hint && !error && (
                <p className="text-xs text-slate-400">{hint}</p>
            )}

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};