import React from "react";

interface CardHeaderProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    rightContent?: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({
    icon,
    title,
    subtitle,
    rightContent,
}) => {
    return (
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                        {icon}
                    </div>
                )}

                <div>
                    <p className="text-base font-bold text-slate-800 leading-tight">
                        {title}
                    </p>

                    {subtitle && (
                        <p className="mt-0.5 text-xs text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {rightContent}
        </div>
    );
};

export default CardHeader;