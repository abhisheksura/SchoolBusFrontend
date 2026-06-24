

import type { DriverResponse } from "../types";
import React            from "react";
import { useNavigate }  from "react-router-dom";
import {
    GraduationCap,
    Building2,
    MapPin,
    Hash,
    Phone,
    ArrowRight,
}                       from "lucide-react";
import {
    StatusBadge,
    CardEditButton,
    ToggleActiveButton,
    BaseCard,
    CardFooter,
    CardMetaRow,
}                           from "@/components";
// =============================================================================
// Props
// =============================================================================

export interface DriverCardProps {
    driver    : DriverResponse;
    /** Show school + branch meta rows — true for SUPER_ADMIN and SCHOOL_ADMIN. */
    showSchool : boolean;
    canEdit    : boolean;
    onEdit     : (student: DriverResponse) => void;
    onToggle   : (student: DriverResponse) => void;
}
export const DriverCard: React.FC<DriverCardProps> = ({
    driver,
    showSchool,
    canEdit,
    onEdit,
    onToggle,
}) => {
    const fullName = [driver.first_name, driver.last_name]
        .filter(Boolean)
        .join(" ");
 
    const initials = [driver.first_name[0], driver.last_name?.[0] ?? ""]
        .join("")
        .toUpperCase();

    return (
        <BaseCard>
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar with initials */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-500 text-sm font-bold text-black shadow-sm shadow-indigo-500/20">
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
                    <Phone size={15} className="text-yellow-500 shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-yellow-700">Phone</p>
                        <p className="text-sm font-bold text-yellow-800">
                            {driver.phone}{" "} 
                        </p>
                    </div>
                </div>
            </div>
            {/* ── Meta rows ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-1 px-5 pb-4">
                {showSchool && (
                    <>
                        <CardMetaRow icon={<Building2 size={11} />}>
                            {/* school_name not on StudentResponse — show school_id */}
                            School: <span>{driver.school_name}</span>
                        </CardMetaRow>
                        <CardMetaRow icon={<MapPin size={11} />}>
                            Branch: <span>{driver.branch_name}</span>
                        </CardMetaRow>
                    </>
                )}
            </div>
            {/* ── Footer actions ───────────────────────────────────────────── */}
            {canEdit && (
                <CardFooter>
                    <CardEditButton onClick={() => onEdit(driver)} />
                    <div className="h-6 w-px bg-slate-100" />
                    <ToggleActiveButton
                        isActive={driver.is_active}
                        onClick={() => onToggle(driver)}
                    />
                </CardFooter>
            )}
        </BaseCard>
    );
}
export default DriverCard;