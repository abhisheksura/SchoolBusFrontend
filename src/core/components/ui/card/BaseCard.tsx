// core/components/ui/BaseCard.tsx

import React from "react";

interface BaseCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    clickable?: boolean;
}

const BaseCard: React.FC<BaseCardProps> = ({
    children,
    className = "",
    onClick,
    clickable = false,

}) => {
    
    const isClickable = clickable || !!onClick;

    return (
        <div
            onClick={onClick}
            className={`
                flex flex-col overflow-hidden rounded-2xl
                border border-slate-200 bg-white shadow-sm
                transition-all duration-200
                hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg
                ${isClickable ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg" : ""}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default BaseCard;