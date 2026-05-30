import React from "react";
import { BaseCard } from "@/components/";
import { CardHeader } from "@/components/";
import { CardFooter } from "@/components/";

interface EntityCardProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    status?: React.ReactNode;
    meta?: React.ReactNode;
    actions?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const EntityCard: React.FC<EntityCardProps> = ({
    icon,
    title,
    subtitle,
    status,
    meta,
    actions,
    onClick,
    className = "",
}) => {
    const isClickable = !!onClick;
    return (
        <BaseCard onClick={onClick}
            clickable={isClickable}
            className={className}
        >
            <CardHeader
                icon={icon}
                title={title}
                subtitle={subtitle}
                rightContent={status}
            />

            {meta != null && (<div className="px-5 pb-4 flex flex-col gap-2">{meta}</div>)}

            {actions != null && <CardFooter>{actions}</CardFooter>}
        </BaseCard>
    );
};