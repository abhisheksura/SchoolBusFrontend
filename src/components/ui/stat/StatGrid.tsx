import React from "react";
import { StatPill } from "./StatPill";
import type { StatPillColor } from "./StatPill";

export interface StatItem {
    value: number | string;
    label: string;
    color?: StatPillColor;
}

interface StatsGridProps {
    items: StatItem[];
    className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
    items,
    className = "",
}) => {
    return (
        <div className={`flex flex-wrap gap-3 ${className}`}>
            {items.map((item, idx) => (
                <StatPill
                    key={idx}
                    value={item.value}
                    label={item.label}
                    color={item.color}
                />
            ))}
        </div>
    );
};