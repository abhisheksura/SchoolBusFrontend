// core/utils/formatters.ts
// Shared formatting helpers. Always use date-fns — never raw Date arithmetic.


import { format, parseISO, formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Date / time
// ---------------------------------------------------------------------------

/** "12 Jan 2025" */

export function formatDate(iso: string): string {
    return format(parseISO(iso), "dd MMM yyyy");
}

/** "12 Jan 2025, 09:45 AM" */

export function formatDateTime(iso: string): string {
    return format(parseISO(iso), "dd MMM yyyy, hh:mm a");
}

/** "2 hours ago" */

export function formatRelative(iso: string): string {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

/** "09:45 AM" */

export function formatTime(iso: string): string {
    return format(parseISO(iso), "hh:mm a");
}

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/** "+91 98765 43210" → formats Indian mobile numbers */

export function formatPhone(phone: string | null): string {
    if (!phone) return "-";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    if (digits.length === 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
    return phone;
}

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

export function formatFullName(
    firstName: string,
    lastName: string | null
): string {
    return [firstName, lastName].filter(Boolean).join(" ");
}

export function getInitials(
    firstName: string,
    lastName: string | null
): string {
    const parts = [firstName, lastName].filter(Boolean) as string[];
    return parts.map((p) => p[0].toUpperCase()).join("");
}