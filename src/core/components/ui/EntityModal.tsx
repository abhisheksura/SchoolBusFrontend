// src/core/components/ui/EntityModal.tsx
import React from "react";
import { Modal } from "./Modal";
import type { EntityModalMode } from "@/components/entity/hooks/useEntityModal";

// -----------------------------------------------------------------------------
// EntityModal
// Reusable CRUD modal wrapper for all entities.
//
// Examples:
//   <EntityModal
//       open={modal.open}
//       mode={modal.mode}
//       entityName="Stop"
//       itemName={modal.item?.stop_name}
//       onClose={modal.close}
//   >
//       <StopForm />
//   </EntityModal>
// -----------------------------------------------------------------------------

interface EntityModalProps {
    open: boolean;

    mode: EntityModalMode;

    entityName: string;

    itemName?: string;

    onClose: () => void;

    children: React.ReactNode;

    size?: "sm" | "md" | "lg" | "xl";

    createSubtitle?: string;
}

export const EntityModal: React.FC<EntityModalProps> = ({
    open,
    mode,
    entityName,
    itemName,
    onClose,
    children,
    size = "md",
    createSubtitle,
}) => {
    const isEdit = mode === "edit";

    return (
        <Modal
            open={open}
            title={`${isEdit ? "Edit" : "Add"} ${entityName}`}
            subtitle={
                isEdit
                    ? `Editing — ${itemName ?? entityName}`
                    : createSubtitle
            }
            onClose={onClose}
            size={size}
        >
            {children}
        </Modal>
    );
};