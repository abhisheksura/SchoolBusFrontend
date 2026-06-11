
// src/components/index.ts

// 🟢 Layer 1: Pure Atoms (ui) - Reached directly without a ui/index.ts middleman
export { StatusBadge } from "./ui/Badge";
export { 
    AddButton, CancelButton, EditButton,
    SubmitButton, CardEditButton, ToggleActiveButton,
    PageToggleButton
} from "./ui/Button";
export { Modal, ConfirmModal } from "./ui/Modal";
export { EmptyState } from "./ui/EmptyState";
// Reaching directly into atomic sub-groups
export { BaseCard } from "./ui/card/BaseCard";
export { CardFooter } from "./ui/card/CardFooter";
export { CardHeader } from "./ui/card/CardHeader";
export { CardMetaRow } from "./ui/card/CardMetaRow";

export { FormField } from "./ui/form/FormField";
export { TextInput } from "./ui/form/TextInput";
export { SearchFilterBar } from "./ui/search/SearchFilterBar";
export { StatsGrid } from "./ui/stat/StatGrid";
export { StatPill } from "./ui/stat/StatPill";

// 🟢 Layer 3: Abstract Organisms (entity) - Handled via local sub-gateway
export {
    useEntityModal,
    useEntityMutation,
    EntityCard,
    EntityModal,
    EntityStatusConfirmModal
} from "./entity";

export { UnauthorizedPage } from "./feedback/UnauthorizedPage";