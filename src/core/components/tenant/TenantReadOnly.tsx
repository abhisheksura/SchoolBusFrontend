// src/core/components/tenant/TenantReadOnly.tsx
//
// Displays school + branch as read-only context in edit forms.
// Pair with TenantSelectors — one or the other renders, never both.
//
// Usage:
//   {tenant.isEditing
//     ? <TenantReadOnly schoolLabel={tenant.schoolLabel} branchLabel={tenant.branchLabel} />
//     : <TenantSelectors ... />
//   }

import React from "react";
import { Lock } from "lucide-react";

interface TenantReadOnlyProps {
    schoolName: string;
    branchName: string;
}

export const TenantReadOnly: React.FC<TenantReadOnlyProps> = ({
    schoolName,
    branchName,
}) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="mb-2 flex items-center gap-1.5">
            <Lock size={11} className="text-slate-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Tenant — cannot be changed after creation
            </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <p className="text-[11px] font-medium text-slate-400">School</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {schoolName || "—"}
                </p>
            </div>
            <div>
                <p className="text-[11px] font-medium text-slate-400">Branch</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {branchName || "—"}
                </p>
            </div>
        </div>
    </div>
);