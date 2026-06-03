// tenant/TenantProvider.tsx
// Provides school-level tenant config (branding, features, theme tokens)
// to the entire app. Fetched once after login using the school_id from
// the auth store.
//
// Currently a skeleton — extend as multi-tenant config API is built out.

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantConfig {
    school_id: number;
    school_name: string;
    logo_url: string | null;
    primary_color: string | null;   // hex, e.g. "#f59e0b"
    features: {
        live_tracking: boolean;
        parent_notifications: boolean;
        attendance: boolean;
    };
}

interface TenantContextValue {
    config: TenantConfig | null;
    isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TenantContext = createContext<TenantContextValue>({
    config: null,
    isLoading: false,
});

export const useTenant = (): TenantContextValue => useContext(TenantContext);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface TenantProviderProps {
    children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
    const { user } = useAuthStore();
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // No user or SUPER_ADMIN (not scoped to a school) — skip fetch
        if (!user) return;

        const schoolIds = user.roles
            .filter((r) => r.school_id !== null && r.is_active)
            .map((r) => r.school_id as number);

        if (schoolIds.length === 0) return;

        // TODO: replace with real API call when tenant config endpoint is ready
        // e.g. GET /api/v1/schools/{schoolId}/config
        setIsLoading(true);
        setTimeout(() => {
            setConfig({
                school_id: schoolIds[0],
                school_name: "Demo School",
                logo_url: null,
                primary_color: null,
                features: {
                    live_tracking: true,
                    parent_notifications: true,
                    attendance: true,
                },
            });
            setIsLoading(false);
        }, 0);
    }, [user]);

    return (
        <TenantContext.Provider value={{ config, isLoading }}>
            {children}
        </TenantContext.Provider>
    );
};