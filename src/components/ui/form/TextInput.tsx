import React, { forwardRef } from "react";

const INPUT_BASE =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 " +
  "text-sm text-slate-800 outline-none transition-all duration-150 " +
  "placeholder:text-slate-400 focus:border-yellow-400 " +
  "focus:ring-2 focus:ring-yellow-500/20 " +
  "disabled:bg-slate-50 disabled:cursor-not-allowed";

const INPUT_ERR =
  "w-full rounded-xl border border-red-300 bg-red-50/40 px-4 py-3 " +
  "text-sm text-slate-800 outline-none transition-all duration-150 " +
  "placeholder:text-slate-400 focus:border-red-400 disabled:cursor-not-allowed";

interface TextInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
        hasError?: boolean;
    }

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    ({ hasError = false, className = "", ...props }, ref) => {
        const computedClasses = `${hasError ? INPUT_ERR : INPUT_BASE} ${className}`.trim();
        return (
            <input
                ref={ref}
                {...props}
                className={computedClasses}
            />
        );
    }
);

TextInput.displayName = "TextInput";