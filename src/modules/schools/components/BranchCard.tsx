// src/modules/schools/components/BranchCard.tsx


import type { BranchResponse } from '../types';
import {
    ArrowLeft,
    Pencil,
    X,
    Check,
    Plus,
    Building2,
    Phone,
    Mail,
    MapPin,
    Loader2,
    PowerOff,
    ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
    <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            active
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
        }`}
    >
        {active ? "Active" : "Inactive"}
    </span>
);

// ---------------------------------------------------------------------------
// Branch card  (read-only row in the branches grid)
// ---------------------------------------------------------------------------

const BranchCard: React.FC<{
    branch: BranchResponse;
    canEdit: boolean;
    onEdit: (branch: BranchResponse) => void;
    onDeactivate: (branch: BranchResponse) => void;
}> = ({ branch, canEdit, onEdit, onDeactivate }) => (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200
                        hover:border-blue-400 hover:shadow-lg hover:-translate-y-1">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                    <Building2 size={18} className="text-blue-500" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800">{branch.branch_name}</p>
                    <StatusBadge active={branch.is_active} />
                </div>
            </div>
            {canEdit && (
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onEdit(branch)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                        <Pencil size={11} strokeWidth={2.5} />
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeactivate(branch)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            branch.is_active
                                ? "border-red-100 text-red-500 hover:border-red-300 hover:bg-red-50"
                                : "border-green-100 text-green-600 hover:border-green-300 hover:bg-green-50"
                        }`}
                    >
                        <PowerOff size={11} strokeWidth={2.5} />
                        {branch.is_active ? "Deactivate" : "Activate"}
                    </button>
                </div>
            )}
        </div>

        {/* Contact details */}
        <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {branch.branch_address ? (
                <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
                    <span>{branch.branch_address}</span>
                </div>
            ) : null}
            {branch.branch_phone ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={12} className="flex-shrink-0 text-slate-400" />
                    <span>{branch.branch_phone}</span>
                </div>
            ) : null}
            {branch.branch_email ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={12} className="flex-shrink-0 text-slate-400" />
                    <span>{branch.branch_email}</span>
                </div>
            ) : null}
            {!branch.branch_address && !branch.branch_phone && !branch.branch_email && (
                <p className="text-xs text-slate-400">No contact details added</p>
            )}
        </div>
    </div>
);

export default BranchCard;