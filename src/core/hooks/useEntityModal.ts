// src/core/hooks/useEntityModal.ts

import { useCallback, useMemo, useState } from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type EntityModalMode = "create" | "edit";

interface EntityModalState<T> {
    open: boolean;
    mode: EntityModalMode;
    item: T | null;
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useEntityModal<T>() {
    const [state, setState] = useState<EntityModalState<T>>({
        open: false,
        mode: "create",
        item: null,
    });

    // -------------------------------------------------------------------------
    // Open Create
    // -------------------------------------------------------------------------

    const openCreate = useCallback(() => {
        setState({
            open: true,
            mode: "create",
            item: null,
        });
    }, []);

    // -------------------------------------------------------------------------
    // Open Edit
    // -------------------------------------------------------------------------

    const openEdit = useCallback((item: T) => {
        setState({
            open: true,
            mode: "edit",
            item,
        });
    }, []);

    // -------------------------------------------------------------------------
    // Close
    // -------------------------------------------------------------------------

    const close = useCallback(() => {
        setState((prev) => ({
            ...prev,
            open: false,
        }));
    }, []);

    // -------------------------------------------------------------------------
    // Derived State
    // -------------------------------------------------------------------------

    const isCreate = state.mode === "create";
    const isEdit = state.mode === "edit";

    // -------------------------------------------------------------------------
    // Return
    // -------------------------------------------------------------------------

    return useMemo(
        () => ({
            ...state,

            openCreate,
            openEdit,
            close,

            isCreate,
            isEdit,
        }),
        [state, openCreate, openEdit, close, isCreate, isEdit]
    );
}