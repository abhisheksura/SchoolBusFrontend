import React from "react";

interface CardFooterProps {
    children: React.ReactNode;
}

const CardFooter: React.FC<CardFooterProps> = ({ children }) => {
    return (
        <div className="mt-auto flex items-center gap-px border-t border-slate-100">
            {children}
        </div>
    );
};

export default CardFooter;