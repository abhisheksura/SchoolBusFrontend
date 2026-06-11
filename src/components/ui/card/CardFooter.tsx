import React from "react";

interface CardFooterProps {
    children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children }) => {
    return (
        <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-auto flex items-center gap-px border-t border-slate-100"
        >
            {children}
        </div>
    );
};