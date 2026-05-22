// src/modules/schools/components/BranchCard.tsx

import React from "react";
import type { BranchResponse } from "../types";

import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Pencil,
    PowerOff,
} from "lucide-react";

interface BranchCardProps {
    branch: BranchResponse;
    canEdit: boolean;
    onEdit: (branch: BranchResponse) => void;
    onDeactivate: (branch: BranchResponse) => void;
}

const BranchCard: React.FC<BranchCardProps> = ({
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
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        branch.is_active
                            ? "bg-green-50 text-green-600"
                            : "bg-slate-100 text-slate-400"
                    }`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            branch.is_active
                                ? "bg-green-500"
                                : "bg-slate-400"
                        }`}
                    />

                    {branch.is_active ? "Active" : "Inactive"}
                </span>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Highlight Box */}
            {/* ---------------------------------------------------------------- */}

      

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
                    <button
                        type="button"
                        onClick={() => onEdit(branch)}
                        className="
                            flex flex-1 items-center justify-center gap-1.5
                            py-3 text-xs font-medium text-slate-500
                            transition-colors
                            hover:bg-slate-50 hover:text-slate-700
                        "
                    >
                        <Pencil size={13} />
                        Edit
                    </button>

                    {/* Divider */}
                    <div className="h-6 w-px bg-slate-100" />

                    {/* Activate / Deactivate */}
                    <button
                        type="button"
                        onClick={() => onDeactivate(branch)}
                        className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                            branch.is_active
                                ? "text-slate-400 hover:bg-red-50 hover:text-red-500"
                                : "text-slate-400 hover:bg-green-50 hover:text-green-600"
                        }`}
                    >
                        <PowerOff size={13} />

                        {branch.is_active ? "Deactivate" : "Activate"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BranchCard;