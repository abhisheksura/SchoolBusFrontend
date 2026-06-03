// ui/components/UnauthorizedPage.tsx
// Shown when RoleGuard redirects a user who lacks the required role.

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { ROLE_LABELS } from "@/features/auth/types";
import type { UserRole } from "@/features/auth/types";

interface UnauthorizedState {
    from?: { pathname: string };
    requiredRoles?: UserRole[];
}

export const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state ?? {}) as UnauthorizedState;
    const requiredRoles = state.requiredRoles ?? [];

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm">

                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 text-red-500">
                    <ShieldOff size={32} strokeWidth={1.5} />
                </div>

                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Access Denied</h1>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        You don't have permission to view this page. Contact your administrator
                        if you believe this is a mistake.
                    </p>
                </div>

                {requiredRoles.length > 0 && (
                    <div className="flex flex-col gap-2 w-full rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Required role{requiredRoles.length > 1 ? "s" : ""}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {requiredRoles.map((role) => (
                                <span
                                    key={role}
                                    className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700"
                                >
                                    {ROLE_LABELS[role]}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft size={16} strokeWidth={2} />
                    Go back
                </button>
            </div>
        </main>
    );
};