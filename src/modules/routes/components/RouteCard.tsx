// src/modules/route/components/RouteCard.tsx
import type { RouteResponse } from "../types";
import { EntityCard } from "@/components";
import { CardEditButton, StatusBadge, ToggleActiveButton } from "@/components";
import {
    Route,
    MapPin
} from "lucide-react";

export interface RouteCardProps {
    route: RouteResponse;
    canEdit: boolean;
    onEdit: (route: RouteResponse) => void;
    onDeactivate: (route: RouteResponse) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
    route,
    canEdit,
    onEdit,
    onDeactivate,
}) => {
    return(
        <div>
        <EntityCard
            icon={<Route size={20} className="text-blue-500" />}
            title={route.route_name}
            subtitle={`Route #${route.route_code}`}
            status={<StatusBadge active={route.is_active} />}            meta={
                <div className="text-xs text-slate-500">
                    {route.school_id && (
                        <p>School Name: {route.school_id}</p>
                    )}
                    <div className="h-6 w-px bg-slate-100" />
                    {route.branch_id && (
                        <p>Branch Name: {route.branch_id}</p>
                    )}
                </div>
            }
            actions={
                canEdit && (
                    <>
                        <CardEditButton onClick={() => onEdit(route)} />
                        <div className="h-6 w-px bg-slate-100" />
                        <ToggleActiveButton
                            isActive={route.is_active}
                            onClick={() => onDeactivate(route)}
                        />
                    </>
                )
            }
        >
        </EntityCard>
        </div>
    );
};
export default RouteCard;