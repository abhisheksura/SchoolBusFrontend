// src/core/components/ui/Button.tsx
//
// Project-wide button primitives.
// Every module imports from here — never declares buttons inline.
//
// Usage:
//   import { SubmitButton, CancelButton, AddButton,
//            EditButton, ToggleActiveButton, PageToggleButton } from '@/core/components/ui';

import React from "react";
import { Plus, Pencil, PowerOff } from "lucide-react";

// ---------------------------------------------------------------------------
// Spinner — shared across buttons
// ---------------------------------------------------------------------------

const Spinner: React.FC = () => (
    <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

// ---------------------------------------------------------------------------
// SubmitButton
// Primary action inside forms — "Create X" / "Update X"
//
// Props:
//   label      — button text, e.g. "Create Branch" | "Update School"
//   isLoading  — shows spinner and disables when true
//   disabled   — additional disabled condition (e.g. !isDirty)
//   fullWidth  — stretches to flex-1 (default true inside forms)
// ---------------------------------------------------------------------------

interface SubmitButtonProps {
    label:      string;
    isLoading?: boolean;
    disabled?:  boolean;
    fullWidth?: boolean;
    type?:      "submit" | "button";
    onClick?:   () => void;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
    label,
    isLoading  = false,
    disabled   = false,
    fullWidth  = true,
    type       = "submit",
    onClick,
}) => (
    <button
        type={type}
        disabled={isLoading || disabled}
        onClick={onClick}
        className={`
            flex-1 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-[#2D1F00] transition hover:bg-yellow-500 disabled:opacity-60
            ${fullWidth ? "flex-1" : ""}
        `.trim().replace(/\s+/g, " ")}
    >
        {isLoading && <Spinner />}
        {label}
    </button>
);

// ---------------------------------------------------------------------------
// CancelButton
// Secondary action inside forms and modals — always "Cancel"
// ---------------------------------------------------------------------------

interface CancelButtonProps {
    onClick:   () => void;
    disabled?: boolean;
}

export const CancelButton: React.FC<CancelButtonProps> = ({
    onClick,
    disabled = false,
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-base font-semibold hover:text-red-400 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
    >
        Cancel
    </button>
);

// ---------------------------------------------------------------------------
// AddButton
// Page-level primary action — "Add School", "Add Branch", etc.
// Always blue, always has a + icon.
// ---------------------------------------------------------------------------

interface AddButtonProps {
    label:   string;
    onClick: () => void;
}

export const AddButton: React.FC<AddButtonProps> = ({ label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
    >
        <Plus size={16} strokeWidth={2.5} />
        {label}
    </button>
);

// ---------------------------------------------------------------------------
// EditButton
// Inline row/card action — opens edit form.
// ---------------------------------------------------------------------------

interface EditButtonProps {
    onClick: () => void;
}

export const EditButton: React.FC<EditButtonProps> = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
    >
        <Pencil size={11} strokeWidth={2.5} />
        Edit
    </button>
);

// ---------------------------------------------------------------------------
// CardEditButton
// This Edit is Used Inside the Card  
// // ------
interface CardEditButtonProps {
    onClick: () => void;
}
export const CardEditButton: React.FC<CardEditButtonProps> = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="
            flex flex-1 items-center justify-center gap-1.5
            py-3 text-xs font-medium text-slate-500
            transition-colors
            hover:bg-slate-50 hover:text-slate-700
        "
    >
        <Pencil size={13} />
        Edit
    </button>
);

// ---------------------------------------------------------------------------
// ToggleActiveButton
// Inline row/card action — deactivate or activate an entity.
// Renders red when active (deactivate action) and green when inactive (activate).
// ---------------------------------------------------------------------------

interface ToggleActiveButtonProps {
    isActive: boolean;
    onClick:  () => void;
}

export const ToggleActiveButton: React.FC<ToggleActiveButtonProps> = ({
    isActive,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
            isActive
                ? "text-slate-400 hover:bg-red-50 hover:text-red-500"
                : "text-slate-400 hover:bg-green-50 hover:text-green-600"
        }`}
    >
        <PowerOff size={11} strokeWidth={2.5} />
        {isActive ? "Deactivate" : "Activate"}
    </button>
);

// ---------------------------------------------------------------------------
// PageToggleButton
// Page-level deactivate/activate — shown in detail page headers.
// Larger than ToggleActiveButton, uses border-only style.
// ---------------------------------------------------------------------------

interface PageToggleButtonProps {
    isActive: boolean;
    label?:   string;         // defaults to "Deactivate" / "Activate"
    onClick:  () => void;
}

export const PageToggleButton: React.FC<PageToggleButtonProps> = ({
    isActive,
    label,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
            isActive
                ? "border-red-100 text-red-500 hover:border-red-300 hover:bg-red-50"
                : "border-green-100 text-green-600 hover:border-green-300 hover:bg-green-50"
        }`}
    >
        <PowerOff size={15} strokeWidth={2.5} />
        {label ?? (isActive ? "Deactivate" : "Activate")}
    </button>
);