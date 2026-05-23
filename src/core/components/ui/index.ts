// src/core/components/ui/index.ts
//
// Single import point for all shared UI primitives.
//
// Usage in any module:
//   import { AddButton, SubmitButton, CancelButton, Modal, ConfirmModal } from '@/core/components/ui';

export { StatusBadge } from './Badge';
export { SubmitButton, CancelButton, AddButton, EditButton, CardEditButton, ToggleActiveButton, PageToggleButton } from './Button';
export { Modal, ConfirmModal } from './Modal';