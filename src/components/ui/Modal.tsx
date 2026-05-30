// src/core/components/ui/Modal.tsx
//
// Project-wide modal primitives.
// Every module imports from here — never declares modals inline.
//
// Usage:
//   import { Modal, ConfirmModal } from '@/core/components/ui/Modal';
//
// Examples:
//   // Create / Edit form modal
//   <Modal open={open} title="Add Branch" subtitle="Under SCH-0001" onClose={handleClose}>
//       <BranchForm ... />
//   </Modal>
//
//   // Destructive confirmation
//   <ConfirmModal
//       open={!!confirmItem}
//       title="Deactivate Branch"
//       message={`Deactivating "${confirmItem?.branch_name}" will mark it inactive.`}
//       confirmLabel="Deactivate"
//       danger
//       onConfirm={handleConfirm}
//       onCancel={() => setConfirmItem(null)}
//   />

import React from "react";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Modal
// Centered overlay for create / edit forms.
//
// Props:
//   open      — controls visibility
//   title     — bold header text
//   subtitle  — muted subtext below title (optional)
//   onClose   — called on × click or backdrop click
//   children  — form content
//   size      — "md" (default, max-w-md) | "lg" (max-w-lg)
// ---------------------------------------------------------------------------

interface ModalProps {
    open:      boolean;
    title:     string;
    subtitle?: string;
    onClose:   () => void;
    children:  React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
    open,
    title,
    subtitle,
    onClose,
    children,
    size = "lg",
}) => {
    if (!open) return null;

    const sizeMap = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-2xl",
    };

    const maxWidth = sizeMap[size];
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl`}>

                {/* ── Header ──────────────────────────── */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">{title}</h2>
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Body ────────────────────────────── */}
                <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// ConfirmModal
// Destructive / non-destructive confirmation dialog.
//
// Props:
//   open         — controls visibility
//   title        — dialog heading
//   message      — body text explaining the action
//   confirmLabel — text on the confirm button, e.g. "Deactivate" | "Delete"
//   danger       — true = red confirm button, false = blue (default true)
//   isLoading    — disables buttons while mutation is pending
//   onConfirm    — called when user confirms
//   onCancel     — called when user cancels or clicks backdrop
// ---------------------------------------------------------------------------

interface ConfirmModalProps {
    open:         boolean;
    title:        string;
    message:      string;
    confirmLabel: string;
    danger?:      boolean;
    isLoading?:   boolean;
    onConfirm:    () => void;
    onCancel:     () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title,
    message,
    confirmLabel,
    danger     = true,
    isLoading  = false,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-1 text-2xl">{danger ? "⚠️" : "ℹ️"}</div>
                <h3 className="mb-2 text-base font-bold text-slate-800">{title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-500">{message}</p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-50 transition-colors ${
                            danger
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};