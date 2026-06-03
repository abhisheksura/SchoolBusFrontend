// src/modules/schools/components/BranchCard.tsx

import React from "react";
import type { DriverResponse } from "../types";
import { StatusBadge, CardEditButton, ToggleActiveButton } from "@/components";
import {
    Building2,
    MapPin,
    Phone,
    Mail,
} from "lucide-react";
import { formatDate, formatPhone } from "@/core/utils/formatters";

export interface DriverCardProps {
    driver      : DriverResponse;
    showSchool  : boolean;
    canEdit     : boolean;
    onEdit      : (driver: DriverResponse) => void;
    onDeactivate: (driver: DriverResponse) => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({
    driver,
    showSchool,
    canEdit,
    onEdit,
    onDeactivate,
}) => {

    const fullName = [driver.first_name, driver.last_name]
        .filter(Boolean)
        .join(" ");
 
    const initials = [driver.first_name[0], driver.last_name?.[0] ?? ""]
        .join("")
        .toUpperCase();

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
                    {/* Avatar with initials */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white shadow-sm shadow-indigo-500/20">
                        {initials}
                    </div>

                    <div>
                        <p className="font-bold text-slate-800 text-base leading-tight">
                            {fullName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            License No: {driver.license_number}
                        </p>
                    </div>
                </div>

                {/* Status */}
                <StatusBadge active={driver.is_active} />
            </div>

            <div className="mx-5 mb-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3">
                    <Phone size={15} className="text-amber-500 shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-amber-700">Phone</p>
                        <p className="text-sm font-bold text-amber-800">
                            {driver.phone}{" "} 
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-1 px-5 pb-3">
                {showSchool && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Building2 size={12} className="shrink-0 text-slate-400" />
                        <span className="truncate"><b>School</b> : {driver.school_name}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={12} className="shrink-0 text-slate-400" />
                    <span className="truncate"><b>Branch</b> : {driver.branch_name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                    Added {formatDate(driver.created_at)}
                </p>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* Bottom Actions */}
            {/* ---------------------------------------------------------------- */}

            {canEdit && (
                <div className="mt-auto flex items-center gap-px border-t border-slate-100">
                    {/* Edit */}
                    <CardEditButton onClick={() => onEdit(driver)} />
                    {/* Divider */}
                    <div className="h-6 w-px bg-slate-100" />
                    {/* Activate / Deactive */}
                    <ToggleActiveButton isActive={driver.is_active}
                        onClick={() => onDeactivate(driver)}
                    />
                </div>
            )}
        </div>
    );
};

export default DriverCard;