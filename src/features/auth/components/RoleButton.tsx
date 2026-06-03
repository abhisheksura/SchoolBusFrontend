// modules/auth/components/RoleButton.tsx
// Selectable role card used in the login form's role picker grid.

import React from "react";
import { Shield, Building2, GitBranch } from "lucide-react";
import type { UserRole } from "../../../features/auth/types";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "../../../features/auth/types";

const ROLE_ICONS: Record<string, React.ReactNode> = {
    SUPER_ADMIN:  <Shield size={18} strokeWidth={1.75} />,
    SCHOOL_ADMIN: <Building2 size={18} strokeWidth={1.75} />,
    BRANCH_ADMIN: <GitBranch size={18} strokeWidth={1.75} />,
};

interface RoleButtonProps {
    role: UserRole;
    isSelected: boolean;
    onSelect: (role: UserRole) => void;
}

const RoleButton: React.FC<RoleButtonProps> = ({ role, isSelected, onSelect }) => {
    return (
        <button
            type="button"
            onClick={() => onSelect(role)}
            aria-pressed={isSelected}
            className={[
                "relative flex items-start gap-3 w-full rounded-xl p-3",
                "text-left cursor-pointer transition-all duration-200",
                isSelected
                    ? "bg-amber-50 border-2 border-yellow-500 shadow-sm"
                    : "bg-white border-2 border-slate-200 hover:border-yellow-300 hover:bg-amber-50/40",
            ].join(" ")}
        >
            <span
                className={[
                    "shrink-0 flex items-center justify-center w-8 h-8 rounded-lg mt-0.5 transition-colors duration-200",
                    isSelected ? "bg-yellow-500 text-white" : "bg-slate-100 text-slate-500",
                ].join(" ")}
            >
                {ROLE_ICONS[role]}
            </span>

            <span className="flex-1 min-w-0">
                <span
                    className={[
                        "block text-sm font-semibold leading-tight tracking-tight",
                        isSelected ? "text-yellow-700" : "text-slate-700",
                    ].join(" ")}
                >
                    {ROLE_LABELS[role]}
                </span>
                <span className="block text-xs text-slate-400 mt-0.5 leading-snug">
                    {ROLE_DESCRIPTIONS[role]}
                </span>
            </span>

            <span
                className={[
                    "shrink-0 w-4 h-4 rounded-full border-2 mt-1 transition-all duration-200",
                    isSelected
                        ? "border-yellow-500 bg-yellow-500 shadow-[inset_0_0_0_2px_white]"
                        : "border-slate-300 bg-white",
                ].join(" ")}
                aria-hidden="true"
            />
        </button>
    );
};

export default RoleButton;