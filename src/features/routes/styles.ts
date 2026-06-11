// src/modules/routes/styles.ts
import type { TripType } from "./types";

export interface TabStyleTokens {
    activeClassName: string;
    inactiveClassName: string;
    badgeClassName: string;
    dotClassName: string;
    dragClassName: string;
}

/** * Strict Tailwind configuration tokens categorized per trip window matrix type 
 */
export const TRIP_TAB_STYLES: Record<TripType, TabStyleTokens> = {
    PICKUP: {
        activeClassName: "border-b-2 border-blue-500 text-blue-600 font-semibold",
        inactiveClassName: "text-slate-400 hover:text-slate-600",
        badgeClassName: "bg-blue-50 text-blue-600 border border-blue-100",
        dotClassName: "bg-blue-500",
        dragClassName: "border-slate-200 hover:border-blue-300",
    },
    DROPOFF: {
        activeClassName: "border-b-2 border-amber-500 text-amber-600 font-semibold",
        inactiveClassName: "text-slate-400 hover:text-slate-600",
        badgeClassName: "bg-amber-50 text-amber-600 border border-amber-100",
        dotClassName: "bg-amber-500",
        dragClassName: "border-slate-200 hover:border-amber-300",
    },
};