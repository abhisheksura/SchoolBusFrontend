// src/modules/schools/components/BranchCard.tsx

import React from "react";
import type { BranchResponse } from "../types";
import { StatusBadge, CardEditButton, ToggleActiveButton } from "@/components";
import {
    Building2,
    MapPin,
    Phone,
    Mail,
} from "lucide-react";

export interface BranchCardProps {
    branch: BranchResponse;
    canEdit: boolean;
    onEdit: (branch: BranchResponse) => void;
    onDeactivate: (branch: BranchResponse) => void;
}

export const BranchCard: React.FC<BranchCardProps> = ({
    branch,
    canEdit,
    onEdit,
    onDeactivate,
}) => {
    return (
        <div
            className="
                flex flex-col overflow-hidden rounded-2xl
                border border-slate-200 bg-white shadow-sm
                transition-all duration-200
                hover:-translate-y-1
                hover:border-blue-400
                hover:shadow-lg
            "
        >
            {/* ---------------------------------------------------------------- */}
            {/* Header */}
            {/* ---------------------------------------------------------------- */}

            <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                        <Building2 size={20} className="text-blue-500" />
                    </div>

                    {/* Branch Info */}
                    <div>
                        <p className="text-base font-bold leading-tight text-slate-800">
                            {branch.branch_name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                            Branch #{branch.branch_id}
                        </p>
                    </div>
                </div>

                {/* Status */}
                <StatusBadge active={branch.is_active} />
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Details */}
            {/* ---------------------------------------------------------------- */}

            <div className="flex flex-col gap-1 px-5 pb-4">
                {branch.branch_address && (
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                        <MapPin
                            size={12}
                            className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <span className="line-clamp-2">
                            {branch.branch_address}
                        </span>
                    </div>
                )}

                {branch.branch_phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone
                            size={12}
                            className="shrink-0 text-slate-400"
                        />

                        <span>{branch.branch_phone}</span>
                    </div>
                )}

                {branch.branch_email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail
                            size={12}
                            className="shrink-0 text-slate-400"
                        />

                        <span className="truncate">
                            {branch.branch_email}
                        </span>
                    </div>
                )}

                {!branch.branch_address &&
                    !branch.branch_phone &&
                    !branch.branch_email && (
                        <p className="text-xs text-slate-400">
                            No contact details added
                        </p>
                    )}
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Bottom Actions */}
            {/* ---------------------------------------------------------------- */}

            {canEdit && (
                <div className="mt-auto flex items-center gap-px border-t border-slate-100">
                    {/* Edit */}
                    <CardEditButton onClick={() => onEdit(branch)} />
                    {/* Divider */}
                    <div className="h-6 w-px bg-slate-100" />
                    {/* Activate / Deactive */}
                    <ToggleActiveButton isActive={branch.is_active}
                        onClick={() => onDeactivate(branch)}
                    />
                </div>
            )}
        </div>
    );
};

export default BranchCard;