// src/components/ui/EmptyState.tsx
//
// Project-wide empty state component.
//
// Used on every list page when there are no results to show — whether
// due to an empty dataset, an active search filter, or a status filter.
//
// The component adapts its message and action button based on the props
// passed in, keeping all empty-state UX consistent across the app.
//
// Usage — basic (no results at all):
//   ```tsx
//   <EmptyState
//       emoji="📍"
//       title="No stops found"
//       description="Add the first stop for this branch."
//   />
//   ```
//
// Usage — with primary action button:
//   ```tsx
//   <EmptyState
//       emoji="🚌"
//       title="No buses found"
//       description="Add the first bus to get started."
//       action={{ label: "Add Bus", onClick: openCreate }}
//   />
//   ```
//
// Usage — after search returns nothing:
//   ```tsx
//   <EmptyState
//       emoji="🔍"
//       title={`No results for "${search}"`}
//       description="Try a different search term."
//   />
//   ```
//
// Usage — scope-prompt (tenant gate not yet satisfied):
//   ```tsx
//   <EmptyState
//       icon={<Building2 size={24} className="text-blue-400" />}
//       title="Select a school to continue"
//       description="Pick a school first, then choose a branch to view its stops."
//       variant="scope"
//   />
//   ```

import React from "react";
import { Plus } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface EmptyStateAction {
    /** Button label, e.g. "Add Stop" */
    label  : string;
    /** Callback fired on button click */
    onClick: () => void;
}

export interface EmptyStateProps {
    /**
     * Emoji character displayed above the title.
     * Use when you want a simple, colourful visual.
     * Mutually exclusive with `icon`.
     */
    emoji?: string;

    /**
     * React node (e.g. a Lucide icon) displayed above the title.
     * Shown inside a coloured circle; the colour adapts to `variant`.
     * Mutually exclusive with `emoji`.
     */
    icon?: React.ReactNode;

    /** Bold heading text. */
    title: string;

    /** Muted supporting text. */
    description?: string;

    /**
     * Optional primary action button shown below the description.
     * Only rendered when `action` is provided.
     */
    action?: EmptyStateAction;

    /**
     * Visual variant:
     *   "default" — dashed slate border (empty list)
     *   "scope"   — dashed blue border (tenant scope not selected)
     *
     * @default "default"
     */
    variant?: "default" | "scope";

    /** Extra Tailwind classes for the outer wrapper. */
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EmptyState
 *
 * Consistent empty-list UI used across every module page.
 * Renders a centred block with an emoji/icon, heading, description,
 * and an optional action button.
 *
 * @param props — see EmptyStateProps
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    emoji,
    icon,
    title,
    description,
    action,
    variant   = "default",
    className = "",
}) => {
    // ── Variant-specific styles ───────────────────────────────────────────────
    const borderColor =
        variant === "scope"
            ? "border-blue-200 bg-blue-50/40"
            : "border-slate-200 bg-white";

    const iconBg =
        variant === "scope"
            ? "bg-blue-100"
            : "bg-slate-100";

    return (
        <div
            className={[
                "flex flex-col items-center gap-3",
                "rounded-2xl border border-dashed py-20 text-center",
                borderColor,
                className,
            ].join(" ")}
        >
            {/* ── Visual: emoji OR icon ─────────────────────────────────────── */}
            {emoji && (
                <span className="text-4xl" role="img" aria-hidden="true">
                    {emoji}
                </span>
            )}

            {!emoji && icon && (
                <div
                    className={[
                        "flex h-14 w-14 items-center justify-center rounded-2xl",
                        iconBg,
                    ].join(" ")}
                >
                    {icon}
                </div>
            )}

            {/* ── Text ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                {description && (
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                        {description}
                    </p>
                )}
            </div>

            {/* ── Optional action button ────────────────────────────────────── */}
            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    className={[
                        "mt-1 inline-flex items-center gap-1.5",
                        "rounded-lg bg-blue-500 px-4 py-2",
                        "text-xs font-semibold text-white",
                        "hover:bg-blue-600 transition-colors",
                    ].join(" ")}
                >
                    <Plus size={13} strokeWidth={2.5} />
                    {action.label}
                </button>
            )}
        </div>
    );
};