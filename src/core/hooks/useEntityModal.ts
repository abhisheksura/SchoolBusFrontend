// src/core/hooks/useEntityModal.ts

import { useState, useCallback } from "react";

export interface EntityModalState<T> {
    isOpen: boolean;
    editingItem: T | null;
}

export function useEntityModal<T>() {
    const [state, setState] = useState<EntityModalState<T>>({
        isOpen: false,
        editingItem: null,
    });

    const openCreate = useCallback(() => {
        setState({
            isOpen: true,
            editingItem: null,
        });
    }, []);

    const openEdit = useCallback((item: T) => {
        setState({
            isOpen: true,
            editingItem: item,
        });
    }, []);

    const close = useCallback(() => {
        setState({
            isOpen: false,
            editingItem: null,
        });
    }, []);

    return {
        ...state,
        openCreate,
        openEdit,
        close,
        isEditing: !!state.editingItem,
    };
}