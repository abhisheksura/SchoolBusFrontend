// src/core/components/modals/EntityStatusConfirmModal.tsx

import { ConfirmModal } from "@/components/";

interface Props<T extends { is_active: boolean }> {
    open: boolean;
    entity: T | null;

    entityName: string;
    entityLabel: string;
    
    isLoading?: boolean;

    onConfirm: () => void;
    onCancel: () => void;
}

export function EntityStatusConfirmModal<
    T extends { is_active: boolean }
>({
    open,
    entity,
    entityName,
    entityLabel,
    isLoading = false,
    onConfirm,
    onCancel,
}: Props<T>) {
    if (!entity) return null;

    const isActive = entity.is_active;

    return (
        <ConfirmModal
            open={open}
            title={
                isActive
                    ? `Deactivate ${entityName}`
                    : `Activate ${entityName}`
            }
            message={
                isActive
                    ? `Deactivating "${entityLabel}" will mark it inactive.`
                    : `Reactivating "${entityLabel}" will restore it as active.`
            }
            confirmLabel={
                isActive
                    ? "Deactivate"
                    : "Activate"
            }
            danger={isActive}
            isLoading={isLoading}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}