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
