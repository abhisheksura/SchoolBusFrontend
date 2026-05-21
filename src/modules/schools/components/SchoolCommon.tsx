// src/modules/schools/components/SchoolCommon.tsx
import React from "react";

export const StatPill: React.FC<{
    value: number;
    label: string;
    color?: "default" | "green" | "slate" | "amber";
}> = ({ value, label, color = "default" }) => {
    const colors = {
        default: "border-slate-200 bg-white text-slate-800",
        green  : "border-green-100 bg-white text-green-700",
        slate  : "border-slate-200 bg-white text-slate-500",
        amber  : "border-amber-100 bg-white text-amber-600",
    };
    const valueColors = {
        default: "text-slate-800",
        green  : "text-green-600",
        slate  : "text-slate-500",
        amber  : "text-amber-600",
    };
    return (
        <div className={`flex items-center gap-2.5 rounded-xl border px-5 py-3 ${colors[color]}`}>
            <span className={`text-2xl font-bold tabular-nums ${valueColors[color]}`}>{value}</span>
            <span className="text-sm text-slate-500">{label}</span>
        </div>
    );
};

export const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
    <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
    >
        {active ? "Active" : "Inactive"}
    </span>
);

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmLabel,
    danger = true,
    onConfirm,
    onCancel,
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-1 text-2xl">{danger ? "⚠️" : "ℹ️"}</div>
            <h3 className="mb-2 text-base font-bold text-slate-800">{title}</h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">{message}</p>
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                        danger ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
);