// modules/auth/components/LoginCard.tsx
// Right panel shell — wraps LoginForm with heading and footer.

import React from "react";
import { Bus } from "lucide-react";

interface LoginCardProps {
    children: React.ReactNode;
}

const LoginCard: React.FC<LoginCardProps> = ({ children }) => {
    return (
        <div className="flex flex-1 lg:w-[40%] items-center justify-center bg-slate-50 min-h-screen px-6 py-12">
            <div className="w-full max-w-md flex flex-col gap-8">

                {/* Mobile-only logo */}
                <div className="flex lg:hidden items-center gap-2.5 justify-center">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500">
                        <Bus size={20} strokeWidth={2} className="text-white" />
                    </div>
                    <span className="font-bold text-slate-800 text-lg tracking-tight">BusTracker</span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />

                    <div className="p-8 flex flex-col gap-6">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                                Admin Portal
                            </p>
                            <h2 className="text-2xl font-bold text-slate-800 leading-tight tracking-tight">
                                Welcome back
                            </h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Sign in to manage your fleet and track buses in real time.
                            </p>
                        </div>

                        {children}
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400">
                    Having trouble signing in?{" "}
                    <a
                        href="mailto:support@bustracker.app"
                        className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2 transition-colors"
                    >
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginCard;