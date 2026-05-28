// src/core/hooks/useEntityMutation.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdatePayload<T, TData> {
    entity: T;
    data: TData;
}

interface UseEntityMutationOptions<T, TCreate, TUpdate> {
    entityName: string;

    queryKey: string[];

    createFn: (data: TCreate) => Promise<any>;

    updateFn: (
        id: number,
        data: TUpdate
    ) => Promise<any>;

    toggleFn: (id: number) => Promise<any>;
    getEntityId: (entity: T) => number;

    onCreateSuccess?: () => void;
    onUpdateSuccess?: () => void;
    onToggleSuccess?: () => void;
}

export function useEntityMutation<
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
}: UseEntityMutationOptions<
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
        mutationFn: (entity: T) =>
            toggleFn(getEntityId(entity)),

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