// core/hooks/useDebounce.ts
// Delays updating a value until the user has stopped changing it.
// Useful for search inputs to avoid firing an API call on every keystroke.
//
// Usage:
//   const debouncedSearch = useDebounce(searchTerm, 400);

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delayMs: number = 400): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debouncedValue;
}