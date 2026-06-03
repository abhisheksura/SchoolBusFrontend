// modules/auth/components/BrandingCard.tsx
// Left 60% panel of the login page — branding, stats, route-map decoration.

import React from "react";
import { Bus, Users, MapPin, Route } from "lucide-react";

const STATS = [
    { icon: <Bus size={16} strokeWidth={2} />,   value: "500+", label: "Buses Tracked" },
    { icon: <Users size={16} strokeWidth={2} />,  value: "12K+", label: "Students Safe" },
    { icon: <Route size={16} strokeWidth={2} />,  value: "200+", label: "Active Routes" },
    { icon: <MapPin size={16} strokeWidth={2} />, value: "98%",  label: "On-Time Rate" },
] as const;

const BrandingCard: React.FC = () => {
    return (
        <div className="relative hidden lg:flex flex-col justify-between w-[60%] min-h-screen overflow-hidden bg-slate-900 px-14 py-12">
            <BrandingBackground />

            {/* Logo */}
            <div className="relative z-10 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-400 shadow-lg shadow-amber-500/30">
                    <Bus size={22} strokeWidth={2} className="text-white" />
                </div>
                <div>
                    <p className="text-white font-bold text-lg leading-none tracking-tight">BusTracker</p>
                    <p className="text-slate-400 text-xs leading-none mt-0.5 tracking-wide uppercase">School Fleet Platform</p>
                </div>
            </div>

            {/* Headline */}
            <div className="relative z-10 flex flex-col gap-6">
                <span className="inline-flex items-center self-start gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    Live Fleet Monitoring
                </span>

                <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight max-w-sm">
                    Every child home,{" "}
                    <span className="text-amber-400">every time.</span>
                </h1>

                <p className="text-slate-400 text-base leading-relaxed max-w-xs">
                    Real-time GPS tracking, automated attendance, and instant
                    notifications — built for schools that care about safety.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-2 max-w-xs">
                    {STATS.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/8 px-4 py-3 backdrop-blur-sm"
                        >
                            <span className="text-amber-400 shrink-0">{stat.icon}</span>
                            <div>
                                <p className="text-white font-bold text-sm leading-none">{stat.value}</p>
                                <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer tags */}
            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                    {["Multi-School", "Role-Based Access", "Live GPS", "Attendance", "Parent Alerts"].map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full border border-yellow-600 bg-slate-800/60 px-3 py-1 text-xs text-slate-400"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <p className="text-slate-600 text-xs">
                    © {new Date().getFullYear()} BusTracker · All rights reserved
                </p>
            </div>
        </div>
    );
};

const BrandingBackground: React.FC = () => (
    <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sky-500/8 blur-3xl" />
        <svg
            className="absolute inset-0 w-full h-full opacity-[0.07]"
            viewBox="0 0 600 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
        >
            {[100, 200, 300, 400, 500, 600, 700].map((y) => (
                <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="white" strokeWidth="0.5" />
            ))}
            {[100, 200, 300, 400, 500].map((x) => (
                <line key={`v${x}`} x1={x} y1="0" x2={x} y2="800" stroke="white" strokeWidth="0.5" />
            ))}
            <polyline
                points="50,150 100,150 100,300 200,300 200,400 350,400 350,250 500,250 500,500 400,500 400,650"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            {[[100,150],[100,300],[200,300],[200,400],[350,400],[350,250],[500,250],[500,500],[400,650]].map(([cx,cy],i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="#f59e0b" opacity="0.8" />
            ))}
        </svg>
        <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
        />
    </div>
);

export default BrandingCard;