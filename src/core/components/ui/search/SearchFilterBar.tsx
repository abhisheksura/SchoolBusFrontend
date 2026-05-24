import React from "react";
import { Search } from "lucide-react";

export interface FilterOption<T extends string = string> {
    label: string;
    value: T;
}

interface SearchFilterBarProps<T extends string = string> {
    search: string;
    placeholder?: string;
    onSearchChange: (value: string) => void;

    filters: FilterOption<T>[];
    activeFilter: T;
    onFilterChange: (value: T) => void;

    className?: string;
}

export const SearchFilterBar = <T extends string>({
    search,
    placeholder = "Search...",
    onSearchChange,
    filters,
    activeFilter,
    onFilterChange,
    className = "",
}: SearchFilterBarProps<T>) => {
    return (
        <div
            className={`
                flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
                rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm
                ${className}
            `}
        >
            <div className="relative flex-1 max-w-lg">
                <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                    value={search}
                    placeholder={placeholder}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {filters.map((f) => (
                    <button
                        key={String(f.value)}
                        type="button"
                        onClick={() => onFilterChange(f.value)}
                        className={`
                            rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize
                            ${
                                activeFilter === f.value
                                    ? "bg-white shadow-sm text-slate-700"
                                    : "text-slate-400 hover:text-slate-600"
                            }
                        `}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
};