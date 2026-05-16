// core/types/pagination.ts
// Generic paginated response shape returned by all list endpoints.

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    pages: number;

}

/*
export interface PaginationParams {
    page?: number;
    page_size?: number;
}
*/


export interface PaginationParams {
    page?: number;
    page_size?: number;
    school_id?: number;
    branch_id?: number;
    active_only?: boolean;
}