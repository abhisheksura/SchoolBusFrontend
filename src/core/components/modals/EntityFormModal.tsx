// src/core/components/modals/EntityFormModal.tsx

import React from "react";
import { Modal } from "@/core/components/ui/Modal";

interface EntityFormModalProps<T> {
    open: boolean;
    editingItem: T | null;

    entityName: string;
    entityId?: number | string;

    onClose: () => void;

    children: React.ReactNode;
}

export function EntityFormModal<T>({
    open,
    editingItem,
    entityName,
    entityId,
    onClose,
    children,
}: EntityFormModalProps<T>) {
    const isEditing = !!editingItem;

    return (
        <Modal
            open={open}
            title={
                isEditing
                    ? `Edit ${entityName}`
                    : `Add ${entityName}`
            }
            subtitle={
                isEditing
                    ? `Editing ${entityName} — ${String(entityId).padStart(4, "0")}`
                    : `Create a ${entityName}`
            }
            onClose={onClose}
        >
            {children}
        </Modal>
    );
}