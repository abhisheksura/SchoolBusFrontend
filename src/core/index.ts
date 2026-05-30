// /src/core/index.ts

// 1. Export network infrastructure primitives
export { apiClient, queryClient } from "./api";

// 2. Export strict runtime environmental variables & configs (MATCHING YOUR CASING)
export { ENV, PAGE_SIZE, QUERY_STALE_TIME, QUERY_GC_TIME } from "./config/env";

// 3. Export generic foundational timing/layout hooks
export { useDebounce, usePagination } from "./hooks";

// 4. Export generic formatting actions and configuration tracking constants
export { 
    formatDate, 
    formatDateTime, 
    formatRelative, 
    formatTime, 
    formatPhone, 
    formatFullName, 
    getInitials 
} from "./utils/formatters";
/**
 * NOTE: Data models and structural interfaces from `core/types/` (like pagination.ts)
 * are deliberately omitted here. They should be pulled via explicit type-only imports 
 * (e.g., `import type { PaginatedResponse } from '@/core/types/pagination'`) 
 * to safeguard compilation and maximize bundler tree-shaking efficiency.
 */