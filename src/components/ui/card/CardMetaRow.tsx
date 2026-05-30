import React from "react";

interface CardMetaRowProps {
    icon: React.ReactNode;
    children: React.ReactNode;
}

export const CardMetaRow: React.FC<CardMetaRowProps> = ({ icon, children }) => {
    return (
        <div className="flex items-start gap-2 text-xs text-slate-500">
            <div className="mt-0.5 text-slate-400">{icon}</div>
            <span className="line-clamp-2">{children}</span>
        </div>
    );
};