import type { MeResponse, UserRole } from './api.types';

export interface AuthState {
    user: MeResponse | null;
    accessToken: string | null;
    activeRole: UserRole | null;
    setAuth: (token: string, user: MeResponse, role: UserRole) => void;
    clearAuth: () => void;
    hasRole: (role: UserRole) => boolean;
    getSchoolIds: () => number[];
    getBranchIds: (schoolId: number) => number[];
}