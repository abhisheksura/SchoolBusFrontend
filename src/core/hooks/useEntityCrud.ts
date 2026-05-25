// src/core/hooks/useEntityCrud.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdatePayload<T, TData> {
    entity: T;
    data: TData;
}

interface UseEntityCrudOptions<T, TCreate, TUpdate> {
    entityName: string;

    queryKey: string[];

    createFn: (data: TCreate) => Promise<any>;

    updateFn: (
        id: number,
        data: TUpdate
    ) => Promise<any>;

    toggleFn: (entity: T) => Promise<any>;

    getEntityId: (entity: T) => number;

    onCreateSuccess?: () => void;
    onUpdateSuccess?: () => void;
    onToggleSuccess?: () => void;
}

export function useEntityCrud<
    T,
    TCreate,
    TUpdate = TCreate
>({
    entityName,
    queryKey,

    createFn,
    updateFn,
    toggleFn,

    getEntityId,

    onCreateSuccess,
    onUpdateSuccess,
    onToggleSuccess,
}: UseEntityCrudOptions<
    T,
    TCreate,
    TUpdate
>) {

    const queryClient = useQueryClient();

    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey,
        });

    // ─────────────────────────────────────────
    // Create
    // ─────────────────────────────────────────

    const createMutation = useMutation({
        mutationFn: createFn,

        onSuccess: () => {
            invalidate();

            toast.success(
                `${entityName} added successfully`
            );

            onCreateSuccess?.();
        },

        onError: (err: any) => {
            toast.error(
                err.response?.data?.detail ||
                `Failed to add ${entityName.toLowerCase()}`
            );
        },
    });

    // ─────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────

    const updateMutation = useMutation({
        mutationFn: ({
            entity,
            data,
        }: UpdatePayload<T, TUpdate>) =>
            updateFn(
                getEntityId(entity),
                data
            ),

        onSuccess: () => {
            invalidate();

            toast.success(
                `${entityName} updated successfully`
            );

            onUpdateSuccess?.();
        },

        onError: (err: any) => {
            toast.error(
                err.response?.data?.detail ||
                `Failed to update ${entityName.toLowerCase()}`
            );
        },
    });

    // ─────────────────────────────────────────
    // Toggle Active
    // ─────────────────────────────────────────

    const toggleMutation = useMutation({
        mutationFn: toggleFn,

        onSuccess: () => {
            invalidate();

            toast.success(
                `${entityName} status updated successfully`
            );

            onToggleSuccess?.();
        },

        onError: (err: any) => {
            toast.error(
                err.response?.data?.detail ||
                `Failed to update ${entityName.toLowerCase()} status`
            );
        },
    });

    const isLoading =
        createMutation.isPending ||
        updateMutation.isPending;

    return {
        createMutation,
        updateMutation,
        toggleMutation,

        isLoading,
    };
}