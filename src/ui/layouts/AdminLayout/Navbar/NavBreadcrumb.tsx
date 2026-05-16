// ui/layouts/AdminLayout/Navbar/NavBreadcrumb.tsx
// Auto-generates a breadcrumb trail from the current URL pathname.
// Matches path segments against sidebarRoutes labels to get human-readable names.
// Falls back to a title-cased version of the segment for unmatched paths.

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { allRoutes } from "@/app/routes/routeConfig";

// Build a lookup: path segment → label
const SEGMENT_LABELS: Record<string, string> = {};
for (const route of allRoutes) {
    const parts = route.path.replace(/^\//, "").split("/");
    if (parts.length > 0 && route.label) {
        // Use the first non-param segment as the key
        const key = parts.find((p) => !p.startsWith(":")) ?? parts[0];
        SEGMENT_LABELS[key] = route.label;
    }
}

function toTitleCase(str: string): string {
    return str
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

const NavBreadcrumb: React.FC = () => {
    const { pathname } = useLocation();

    const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

    // Build cumulative hrefs: /schools, /schools/1, /schools/1/branches
    const crumbs = segments.map((seg, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        // Skip dynamic :param segments for display
        const isParam = /^\d+$/.test(seg);
        const label = isParam
            ? null
            : (SEGMENT_LABELS[seg] ?? toTitleCase(seg));
        return { label, href, isParam };
    }).filter((c) => c.label !== null);

    if (crumbs.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-sm">
                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <li key={crumb.href} className="flex items-center gap-1">
                            {i > 0 && (
                                <ChevronRight
                                    size={13}
                                    strokeWidth={2}
                                    className="text-slate-400 shrink-0"
                                />
                            )}
                            {isLast ? (
                                <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    to={crumb.href}
                                    className="text-slate-500 hover:text-slate-700 transition-colors truncate max-w-[140px]"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default NavBreadcrumb;