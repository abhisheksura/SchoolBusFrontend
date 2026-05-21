// src/modules/schools/components/SchoolCard.tsx

import React from 'react';
import { Pencil, Trash2, Building2, School, CheckCircle2, PowerOff, XCircle } from 'lucide-react';
import type { SchoolResponse, BranchResponse } from '../types';
import { format } from 'date-fns';
import { formatDate } from "@/core/utils/formatters";


// ==================== Component Props ====================

interface SchoolCardProps {
    school: SchoolResponse;
    //branchCount?: number;
    onClick: () => void;
    //onEdit     : (school: SchoolResponse) => void;
    //onDeactivate: (school: SchoolResponse) => void;
}

// ==================== Component ====================
export const SchoolCard: React.FC<SchoolCardProps> = ({
    school,
    //branchCount,
    onClick,
    //onEdit,
    //onDeactivate
}) => {    
    return (
        <div onClick={onClick}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden cursor-pointer transition-all duration-200
                        hover:border-blue-400 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                        <School size={20} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-base leading-tight">{school.school_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">ID #{school.school_id}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    school.is_active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${school.is_active ? "bg-green-500" : "bg-slate-400"}`} />
                    {school.is_active ? "Active" : "Inactive"}
                </span>
            </div>
            <div className="mx-5 mb-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3">
                    {/* <Users size={15} className="text-amber-500 shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-amber-700">{sizeLabel}</p>
                        <p className="text-sm font-bold text-amber-800">
                            {bus.capacity}{" "}
                            <span className="font-normal text-amber-600 text-xs">seats</span>
                        </p>
                    </div>
                    */}
                </div>
            </div>

            <div className="flex flex-col gap-1 px-5 pb-3">
                <p className="text-xs text-slate-400 mt-0.5">Added {formatDate(school.created_at)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Update {formatDate(school.updated_at)}</p>
            </div>
        </div>
        
    );
};
