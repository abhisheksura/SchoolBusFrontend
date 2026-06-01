// ui/layouts/AdminLayout/Navbar/NavBreadcrumb.tsx

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { allRoutes } from "@/app/routes";

// ------------------------------------------------------------------
// Route segment → label lookup
// ------------------------------------------------------------------

const SEGMENT_LABELS: Record<string, string> = {};

for (const route of allRoutes) {
    const parts = route.path.replace(/^\//, "").split("/");

    if (route.label) {
        const key =
            parts.find((p) => !p.startsWith(":")) ?? parts[0];

        SEGMENT_LABELS[key] = route.label;
    }
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function toTitleCase(value: string): string {
    return value
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isNumericSegment(segment: string): boolean {
    return /^\d+$/.test(segment);
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

const NavBreadcrumb: React.FC = () => {
    const location = useLocation();

    const pathname = location.pathname;

    const state = location.state as
        | {
              breadcrumbLabel?: string;
          }
        | undefined;

    const segments = pathname
        .replace(/^\//, "")
        .split("/")
        .filter(Boolean);

    // ------------------------------------------------------------------
    // Build breadcrumb list
    // ------------------------------------------------------------------

    const crumbs: Array<{
        href: string;
        label: string;
    }> = [];

    segments.forEach((segment, index) => {
        // Skip numeric route params like /schools/12
        if (isNumericSegment(segment)) {
            return;
        }

        const href =
            "/" + segments.slice(0, index + 1).join("/");

        crumbs.push({
            href,
            label:
                SEGMENT_LABELS[segment] ??
                toTitleCase(segment),
        });
    });

    // ------------------------------------------------------------------
    // Append dynamic page title
    // Example:
    // Schools > Green Valley School
    // ------------------------------------------------------------------

    if (state?.breadcrumbLabel) {
        crumbs.push({
            href: pathname,
            label: state.breadcrumbLabel,
        });
    }

    if (crumbs.length === 0) {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-sm">

                {crumbs.map((crumb, index) => {
                    const isLast =
                        index === crumbs.length - 1;

                    return (
                        <li
                            key={`${crumb.href}-${crumb.label}`}
                            className="flex items-center gap-1"
                        >
                            {index > 0 && (
                                <ChevronRight
                                    size={13}
                                    strokeWidth={2}
                                    className="text-slate-400"
                                />
                            )}

                            {isLast ? (
                                <span className="font-semibold text-slate-800">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    to={crumb.href}
                                    className="text-slate-500 hover:text-slate-700 transition-colors"
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