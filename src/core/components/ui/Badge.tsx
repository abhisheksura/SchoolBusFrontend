// src/core/components/ui/Badge.tsx

// ---------------------------------------------------------------------------
// StatusBadge
// Active / inactive status pill used on cards, tables, and detail pages.
// Single source of truth — import from '@/core/components/ui' everywhere.
// ---------------------------------------------------------------------------
 
interface StatusBadgeProps {
    active: boolean;
}
 
export const StatusBadge: React.FC<StatusBadgeProps> = ({ active }) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            active
                ? "bg-green-100 text-green-500"
                : "bg-red-100 text-slate-400"
        }`}
    >
        <span
            className={`h-1.5 w-1.5 rounded-full ${
                active
                    ? "bg-green-500"
                    : "bg-slate-400"
            }`}
        />
        {active ? "Active" : "Inactive"}
    </span>
);