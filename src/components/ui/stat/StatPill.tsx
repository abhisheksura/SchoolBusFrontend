import React from "react";

export type StatPillColor = "default" | "green" | "slate" | "amber";

interface StatPillProps {
    value: number | string;
    label: string;
    color?: StatPillColor;
}

export const StatPill: React.FC<StatPillProps> = ({
    value,
    label,
    color = "default",
}) => {
    const colors = {
        default: "border-slate-200 text-slate-800",
        green: "border-green-100 text-green-700",
        slate: "border-slate-200 text-slate-500",
        amber: "border-amber-100 text-amber-600",
    };

    return (
        <div
            className={`
                flex items-center gap-2.5 rounded-xl border bg-white
                px-5 py-3 shadow-sm
                ${colors[color]}
            `}
        >
            <span className="text-2xl font-bold tabular-nums">
                {value}
            </span>
            <span className="text-sm text-slate-500">{label}</span>
        </div>
    );
};