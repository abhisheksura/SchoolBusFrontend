// app/store/uiStore.ts
// Global UI state: sidebar open/close, active modal, loading overlays.
// Feature-specific state lives in its own module — this is only for
// app-shell-level concerns.

import { create } from "zustand";

interface UIState {
    // Sidebar
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;

    // Full-page loading overlay (e.g. during logout)
    pageLoading: boolean;
    setPageLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

    pageLoading: false,
    setPageLoading: (loading) => set({ pageLoading: loading }),
}));