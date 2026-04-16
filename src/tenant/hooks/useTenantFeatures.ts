// tenant/hooks/useTenantFeatures.ts
// Convenience hook for checking whether a feature flag is enabled
// for the current tenant (school).
//
// Usage:
//   const { isEnabled } = useTenantFeatures();
//   if (isEnabled("live_tracking")) { ... }

import { useTenant } from "../TenantProvider";

type FeatureKey = "live_tracking" | "parent_notifications" | "attendance";

export function useTenantFeatures() {
    const { config } = useTenant();

    const isEnabled = (feature: FeatureKey): boolean => {
        if (!config) return true; // default open until config loads
        return config.features[feature] ?? false;
    };

    return { isEnabled, features: config?.features ?? null };
}   