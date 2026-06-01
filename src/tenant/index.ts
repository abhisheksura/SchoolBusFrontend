// src/tenant/index.ts

// 1. Export the Main Provider (and any related context/types if applicable)
export { TenantProvider } from './TenantProvider';

// 2. Export Public Components
export { TenantReadOnly } from './components/TenantReadOnly';
export { TenantSelector } from './components/TenantSelectors';

// 3. Export Public Hooks
export { useTenantFeatures } from './hooks/useTenantFeatures';
export { useTenantFilter } from './hooks/useTenantFilter';
export { useTenantOptions } from './hooks/useTenantOptions';
export { useTenantScope } from './hooks/useTenantScope';