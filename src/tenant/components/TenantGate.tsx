// src/core/components/tenant/TenantGate.tsx
//
// Renders the school + branch scope-selection UI that sits at the top of
// every list page requiring tenant narrowing (SUPER_ADMIN, SCHOOL_ADMIN).
//
// This component is PURELY presentational — it owns no state of its own.
// All data, loading flags, and callbacks come from the `gate` prop produced
// by the `useTenantGate()` hook.
//
// Rendering matrix:
//   SUPER_ADMIN  → school selector (editable)  +  branch selector (editable)
//   SCHOOL_ADMIN → school pill (locked/read-only)  +  branch selector (editable)
//   BRANCH_ADMIN → returns null  (showGate === false)
//
// Usage:
//   ```tsx
//   const gate = useTenantGate();
//   <TenantGate gate={gate} />
//   ```

import React from "react";
import { Building2, Lock } from "lucide-react";
import type { TenantGateState } from "../hooks/useTenantGate";

// ─────────────────────────────────────────────────────────────────────────────
// Shared select className — defined once to stay consistent across selectors
// ─────────────────────────────────────────────────────────────────────────────

const SELECT_CLASS = [
    "w-full rounded-xl border border-slate-200 bg-white",
    "px-3 py-2.5 text-sm text-slate-800",
    "outline-none appearance-none",
    "transition-all duration-150",
    "focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20",
    "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
].join(" ");

// ─────────────────────────────────────────────────────────────────────────────
// FieldLabel — shared label above each selector / pill
// ─────────────────────────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ text: string; required?: boolean }> = ({
    text,
    required = false,
}) => (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {text}
        {required && <span className="ml-1 text-red-500">*</span>}
    </label>
);

// ─────────────────────────────────────────────────────────────────────────────
// LockedPill — read-only display for JWT-locked school / branch
// ─────────────────────────────────────────────────────────────────────────────

interface LockedPillProps {
    label    : string;   // field label, e.g. "School"
    value    : string;   // display text, e.g. school/branch name
    title   ?: string;   // tooltip explaining the lock
}

const LockedPill: React.FC<LockedPillProps> = ({ label, value, title }) => (
    <div className="flex flex-col gap-1.5">
        <FieldLabel text={label} />
        <div
            title={title}
            className={[
                "flex items-center gap-2.5 rounded-xl",
                "border border-slate-200 bg-slate-100",
                "px-3 py-2.5",
            ].join(" ")}
        >
            <Building2 size={14} className="shrink-0 text-slate-400" />
            <span className="flex-1 truncate text-sm font-medium text-slate-600">
                {value}
            </span>
            <span
                className={[
                    "inline-flex shrink-0 items-center gap-1 rounded-full",
                    "border border-amber-200 bg-amber-50",
                    "px-2 py-0.5 text-[10px] font-semibold text-amber-700",
                ].join(" ")}
            >
                <Lock size={9} strokeWidth={2.5} />
                Locked
            </span>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SchoolSelector — editable dropdown for SUPER_ADMIN
// ─────────────────────────────────────────────────────────────────────────────

interface SchoolSelectorProps {
    value    : number | undefined;
    options  : Array<{ value: number; label: string }>;
    isLoading: boolean;
    onChange : (schoolId: number | undefined) => void;
}

const SchoolSelector: React.FC<SchoolSelectorProps> = ({
    value,
    options,
    isLoading,
    onChange,
}) => (
    <div className="flex flex-col gap-1.5">
        <FieldLabel text="School" required />
        <select
            value={value ?? ""}
            disabled={isLoading}
            onChange={(e) => {
                const val = e.target.value;
                onChange(val ? Number(val) : undefined);
            }}
            className={SELECT_CLASS}
        >
            <option value="">
                {isLoading ? "Loading Schools…" : "Select School"}
            </option>
            {options.map((s) => (
                <option key={s.value} value={s.value}>
                    {s.label}
                </option>
            ))}
        </select>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// BranchSelector — editable dropdown for SUPER_ADMIN and SCHOOL_ADMIN
// ─────────────────────────────────────────────────────────────────────────────

interface BranchSelectorProps {
    value          : number | undefined;
    options        : Array<{ value: number; label: string }>;
    isLoading      : boolean;
    /** Whether a school has been resolved (needed to know if branches can load). */
    schoolResolved : boolean;
    /** True only for SUPER_ADMIN — drives the "select school first" hint. */
    isSuperAdmin   : boolean;
    onChange       : (branchId: number | undefined) => void;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({
    value,
    options,
    isLoading,
    schoolResolved,
    isSuperAdmin,
    onChange,
}) => {
    // Contextual placeholder guides the user step-by-step
    const placeholder =
        isSuperAdmin && !schoolResolved ? "Select School first"
        : isLoading                     ? "Loading Branches…"
        : options.length === 0          ? "No Branches available"
        : "Select Branch";

    return (
        <div className="flex flex-col gap-1.5">
            <FieldLabel text="Branch" required />
            <select
                value={value ?? ""}
                // Disabled while loading OR when there is no school yet (SUPER_ADMIN)
                disabled={isLoading || !schoolResolved}
                onChange={(e) => {
                    const val = e.target.value;
                    onChange(val ? Number(val) : undefined);
                }}
                className={SELECT_CLASS}
            >
                <option value="">{placeholder}</option>
                {options.map((b) => (
                    <option key={b.value} value={b.value}>
                        {b.label}
                    </option>
                ))}
            </select>
            {/* Hint only shown for SUPER_ADMIN before school is picked */}
            {isSuperAdmin && !schoolResolved && (
                <p className="text-[11px] text-slate-400">
                    Pick a School above to load its branches.
                </p>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// TenantGate — main export
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantGateProps {
    /** State object produced by the useTenantGate() hook. */
    gate: TenantGateState;

    /**
     * Optional extra Tailwind classes applied to the outer wrapper.
     * Useful when the consuming page needs to adjust spacing or width.
     */
    className?: string;
}

/**
 * TenantGate
 *
 * Renders the school + branch scope selectors for SUPER_ADMIN and
 * SCHOOL_ADMIN.  For BRANCH_ADMIN it returns null immediately — nothing
 * is rendered and the calling page proceeds directly to its content
 * (because gate.scopeReady is already true from the JWT).
 *
 * All data-fetching and state management lives in `useTenantGate()`.
 * This component is purely visual.
 *
 * @param gate      — result of useTenantGate()
 * @param className — optional extra Tailwind wrapper classes
 */
export const TenantGate: React.FC<TenantGateProps> = ({ gate, className = "" }) => {
    // BRANCH_ADMIN: scope is fully locked from JWT — nothing to render
    if (!gate.showGate) return null;

    return (
        <div
            className={[
                "flex flex-col gap-4 rounded-2xl",
                "border border-blue-100 bg-blue-50/60",
                "px-6 py-5",
                className,
            ].join(" ")}
            role="region"
            aria-label="Select tenant scope"
        >
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500">
                    <Building2 size={14} strokeWidth={2.5} className="text-white" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-800">
                        Select Scope
                    </p>
                    <p className="text-xs text-slate-500">
                        {gate.isSuperAdmin
                            ? "Choose a School and Branch to view data"
                            : "Choose a Branch to view data"
                        }
                    </p>
                </div>
            </div>

            {/* ── Selectors grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                {/* Left column: editable school selector (SA) or locked pill (school admin) */}
                {gate.isSuperAdmin ? (
                    <SchoolSelector
                        value={gate.selectorSchoolId}
                        options={gate.schoolOptions}
                        isLoading={gate.schoolsLoading}
                        onChange={(schoolId) => {
                            // onSchoolChange already resets selectorBranchId internally
                            gate.onSchoolChange(schoolId);
                        }}
                    />
                ) : (
                    <LockedPill
                        label="School"
                        value={
                            gate.lockedSchoolName ??
                            `School #${gate.resolvedSchoolId}`
                        }
                        title="Your School is determined by your account role and cannot be changed."
                    />
                )}

                {/* Right column: branch selector — always editable when gate is shown */}
                <BranchSelector
                    value={gate.selectorBranchId}
                    options={gate.branchOptions}
                    isLoading={gate.branchesLoading}
                    schoolResolved={!!gate.resolvedSchoolId}
                    isSuperAdmin={gate.isSuperAdmin}
                    onChange={gate.onBranchChange}
                />
            </div>
        </div>
    );
};