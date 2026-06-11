// src/tenant/hooks/useTenantOptions.ts

import { useTenantGate, type SelectOption, type TenantGateState } from "./useTenantGate";

// ---------------------------------------------------------------------------
// Input Interface
// ---------------------------------------------------------------------------
interface UseTenantOptionsInput {
    /** When editing an existing entity, pass its stored tenant IDs. */
    entitySchoolId?: number;
    entityBranchId?: number;
}

// ---------------------------------------------------------------------------
// Output Interface
// ---------------------------------------------------------------------------
export interface UseTenantOptionsResult {
    /** true = editing an existing entity; false = creating a new entity */
    isEditing: boolean;
    
    /** Pickable options mapped for select components */
    schoolOptions: SelectOption[];
    branchOptions: SelectOption[];
    
    /** Handler for when a user alters the school dropdown selection */
    onSchoolChange: (schoolId: number | undefined) => void;
    
    /** The raw underlying state machine engine if advanced access is required */
    gate: TenantGateState;
}

// ---------------------------------------------------------------------------
// Hook Implementation
// ---------------------------------------------------------------------------
export function useTenantOptions({
    entitySchoolId,
    entityBranchId,
}: UseTenantOptionsInput = {}): UseTenantOptionsResult {
    // Consume the unified core caching engine
    const gate = useTenantGate();
    
    // Derived state check based on the entity payload existence
    const isEditing = entitySchoolId !== undefined;

    return {
        isEditing,
        schoolOptions: gate.schoolOptions,
        branchOptions: gate.branchOptions,
        onSchoolChange: gate.onSchoolChange,
        gate,
    };
}