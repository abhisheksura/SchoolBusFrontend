// src/tenant/TenantProvider.tsx
//
// Provides school-level tenant configuration (branding, features, theme tokens)
// to the entire application lifecycle. 
//
// Dynamic Theme Loading Pattern:
//   1. Attempts to fetch a static file asset override (`/themes/school-${id}.json`).
//   2. If found, injects those values as native CSS Custom Properties onto the DOM root.
//   3. If the file is missing (404), it catches the error gracefully, resets to default 
//      styles, and uses the database-provided color fallback string.
//
// Usage:
//   Wrap your App/Routes in <TenantProvider> right under your Auth/Query providers.
//   Consume flags anywhere via: const { config, isTenantLoading } = useTenant();

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantConfig {
    school_id: number;
    school_name: string;
    logo_url: string | null;
    primary_color: string; // Dynamic hex backup from database (e.g., "#f59e0b")
    features: {
        live_tracking: boolean;
        parent_notifications: boolean;
        attendance: boolean;
    };
}

interface TenantContextValue {
    config: TenantConfig | null;
    isLoading: boolean;
    activeThemeId: string; // Useful for debugging or conditional theme assets
}

// ─────────────────────────────────────────────────────────────────────────────
// Context & Consumer Hook
// ─────────────────────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantContextValue>({
    config: null,
    isLoading: false,
    activeThemeId: "default",
});

/** Hook to easily pull global tenant configurations anywhere in the UI hierarchy */
export const useTenant = (): TenantContextValue => useContext(TenantContext);

// ─────────────────────────────────────────────────────────────────────────────
// Core System Baseline Defaults
// ─────────────────────────────────────────────────────────────────────────────

/** * Rigid baseline system variables. These serve as our ultimate fallback state
 * to ensure that even if file loading fails or a session breaks, the application 
 * never renders broken styling layout states.
 */
const DEFAULT_SYSTEM_THEME: Record<string, string> = {
    "--color-primary": "#3b82f6",       // Default Tailwind Blue 500
    "--color-primary-hover": "#2563eb", // Default Tailwind Blue 600
    "--radius-tenant": "0.5rem",         // Default UI rounding architecture
};

// ─────────────────────────────────────────────────────────────────────────────
// Provider Component Implementation
// ─────────────────────────────────────────────────────────────────────────────

interface TenantProviderProps {
    children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
    const { user } = useAuthStore();
    const [config, setConfig] = useState<TenantConfig | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeThemeId, setActiveThemeId] = useState<string>("default");

    // ── Helper: Purge Custom Themes & Restore Application Defaults ──────────
    const restoreSystemDefaults = () => {
        setConfig(null);
        setActiveThemeId("default");
        Object.entries(DEFAULT_SYSTEM_THEME).forEach(([cssVarName, value]) => {
            document.documentElement.style.setProperty(cssVarName, value);
        });
    };

    // ── Helper: Asset Fetcher & Style Injection Pipeline ────────────────────
    const applyTenantThemeEngine = async (schoolId: number, databaseBackupColor: string) => {
        try {
            // Production Strategy: Check public directory for explicit layout customization models
            // Files live at: public/themes/school-{id}.json
            const response = await fetch(`/themes/school-${schoolId}.json`);
            
            // If asset file is absent, route immediately to the catch block fallback engine
            if (!response.ok) {
                throw new Error(`Theme asset manifest missing for school ID: ${schoolId}`);
            }
            
            const dynamicThemeVariables = await response.json();
            
            // File is present! Loop and inject configurations straight to root DOM node
            Object.entries(dynamicThemeVariables).forEach(([cssVarName, cssValue]) => {
                document.documentElement.style.setProperty(cssVarName, cssValue as string);
            });
            
            setActiveThemeId(`file-school-${schoolId}`);
            
        } catch (error) {
            // FALLBACK STRATEGY: File missing or malformed.
            // 1. Wipe out any lingering values from a past tenant session
            restoreSystemDefaults();
            
            // 2. Inject the backup configuration string served out of the database API
            document.documentElement.style.setProperty("--color-primary", databaseBackupColor);
            
            setActiveThemeId(`fallback-db-school-${schoolId}`);
            console.warn(`[TenantThemeEngine]: ${error instanceof Error ? error.message : "Asset exception"}. Fallback applied.`);
        }
    };

    // ── Sync Lifecycle Effect: Reacts immediately to User Session State ─────
    useEffect(() => {
        // No authenticated session present (e.g., login screen, logged out)
        if (!user) {
            restoreSystemDefaults();
            return;
        }

        // Locate an active role binding that contains an accessible tenant school scope ID
        const applicableTenantRole = user.roles.find(
            (role) => role.is_active && role.school_id !== null
        );

        // SUPER_ADMIN or user without a functional school reference requires no tenant isolation tracking
        if (!applicableTenantRole || !applicableTenantRole.school_id) {
            restoreSystemDefaults();
            return;
        }

        const currentActiveSchoolId = applicableTenantRole.school_id;

        setIsLoading(true);
        
        // TODO: Swap out this execution block with your concrete API service call layer 
        // Example: api.get(`/api/v1/schools/${currentActiveSchoolId}/config`)
        const simulateApiCall = setTimeout(async () => {
            try {
                const mockedApiResponse: TenantConfig = {
                    school_id: currentActiveSchoolId,
                    school_name: applicableTenantRole.school_name ?? "System Enrolled School",
                    logo_url: null,
                    primary_color: "#f59e0b", // Secondary tier database fallback color (Amber)
                    features: {
                        live_tracking: true,
                        parent_notifications: true,
                        attendance: true,
                    },
                };

                setConfig(mockedApiResponse);
                
                // Route directly to theme loader state runner
                await applyTenantThemeEngine(currentActiveSchoolId, mockedApiResponse.primary_color);
            } catch (err) {
                console.error("[TenantProvider Initialization Failure]:", err);
                restoreSystemDefaults();
            } finally {
                setIsLoading(false);
            }
        }, 0);

        return () => clearTimeout(simulateApiCall);
    }, [user]);

    // ── Structural Render Layer ──────────────────────────────────────────────
    return (
        <TenantContext.Provider value={{ config, isLoading, activeThemeId }}>
            {children}
        </TenantContext.Provider>
    );
};