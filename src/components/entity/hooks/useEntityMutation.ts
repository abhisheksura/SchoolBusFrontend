// src/core/hooks/useEntityMutation.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdatePayload<T, TData> {
    entity: T;
    data: TData;
}

export interface UseEntityMutationOptions<T, TCreate, TUpdate> {
    entityName: string;

    queryKey: string[];

    createFn: (data: TCreate) => Promise<any>;

    updateFn: (
        id: number,
        data: TUpdate
    ) => Promise<any>;

    toggleFn: (entity: T) => Promise<any>;
    getEntityId: (entity: T) => number;
    getEntityName: (entity: T) => string;
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
    getEntityName,

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

        onSuccess: (_data, variables: UpdatePayload<T, TUpdate>) => {
            invalidate();

            toast.success(
                `${entityName} ${getEntityName(variables.entity)} updated successfully`
            );

            onUpdateSuccess?.();
        },

        onError: (err: any, variables: UpdatePayload<T, TUpdate>) => {
            toast.error(
                err.response?.data?.detail ||
                `Failed to update ${entityName} ${getEntityName(variables.entity).toLowerCase()}`
            );
        },
    });

    // ─────────────────────────────────────────
    // Toggle Active
    // ─────────────────────────────────────────

    const toggleMutation = useMutation({
        mutationFn: (entity: T) =>
            toggleFn(entity),

        onSuccess: (_data, entity: T) => {
            invalidate();

            toast.success(
                `${entityName} ${getEntityName(entity)} status updated successfully`
            );

            onToggleSuccess?.();
        },

        onError: (err: any, entity: T) => {
            toast.error(
                err.response?.data?.detail ||
                `Failed to update ${entityName} ${getEntityName(entity).toLowerCase()} status`
            );
        },
    });

    const isLoading =
        createMutation.isPending ||
        updateMutation.isPending ||
        toggleMutation.isPending;

    return {
        createMutation,
        updateMutation,
        toggleMutation,

        isLoading,
    };
}