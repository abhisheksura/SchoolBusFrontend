// src/modules/route/components/StopCard.tsx
import type { StopResponse } from "../types";
import { EntityCard } from "@/components";
import { CardEditButton, StatusBadge, ToggleActiveButton } from "@/components";
import {
    MapPin
} from "lucide-react";

export interface StopCardProps {
    stop: StopResponse;
    canEdit: boolean;
    onEdit: (stop: StopResponse) => void;
    onDeactivate: (stop: StopResponse) => void;
}

export const StopCard: React.FC<StopCardProps> = ({
    stop,
    canEdit,
    onEdit,
    onDeactivate,
}) => {
    return(
        <div>
        <EntityCard
            icon={<MapPin size={20} className="text-blue-500" />}
            title={stop.stop_name}
            subtitle={`Stop #${stop.stop_id}`}
            status={<StatusBadge active={stop.is_active} />}            meta={
                <div className="text-xs text-slate-500">
                    {stop.branch_id && (
                        <p>Branch ID: {stop.branch_id}</p>
                    )}
                </div>
            }
            actions={
                canEdit && (
                    <>
                        <CardEditButton onClick={() => onEdit(stop)} />
                        <div className="h-6 w-px bg-slate-100" />
                        <ToggleActiveButton
                            isActive={stop.is_active}
                            onClick={() => onDeactivate(stop)}
                        />
                    </>
                )
            }
        >
        </EntityCard>
        </div>
    );
};
export default StopCard;