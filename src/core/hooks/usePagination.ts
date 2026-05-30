// src/core/hooks/usePagination.ts
// Manages page/pageSize state for server-side paginated tables.
// Resets to page 1 whenever filters change.
//
// Usage:
//   const { page, pageSize, setPage, setPageSize, resetPage } = usePagination();

import { useState, useCallback } from "react";
import { PAGE_SIZE } from "@/core";

interface UsePaginationReturn {
    page: number;
    pageSize: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    resetPage: () => void;
}

export function usePagination(defaultPageSize: number = PAGE_SIZE): UsePaginationReturn {
    const [page, setPageState] = useState(1);
    const [pageSize, setPageSizeState] = useState(defaultPageSize);

    const setPage = useCallback((p: number) => setPageState(p), []);

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPageState(1);
    }, []);

    const resetPage = useCallback(() => setPageState(1), []);

    return { page, pageSize, setPage, setPageSize, resetPage };
}