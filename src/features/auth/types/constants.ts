//

import type { UserRole } from './api.types';

export const ADMIN_ROLES: UserRole[] = [
    "SUPER_ADMIN",
    "SCHOOL_ADMIN",
    "BRANCH_ADMIN",
];

export const ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN:  "Super Admin",
    SCHOOL_ADMIN: "School Admin",
    BRANCH_ADMIN: "Branch Admin",
    DRIVER:       "Driver",
    PARENT:       "Parent",
    STUDENT:      "Student",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    SUPER_ADMIN:  "Full platform access across all schools",
    SCHOOL_ADMIN: "Manage branches, fleet & staff",
    BRANCH_ADMIN: "Day-to-day routes, trips & students",
    DRIVER:       "View assigned trips & routes",
    PARENT:       "Track your child's bus in real time",
    STUDENT:      "View your own trip status",
};