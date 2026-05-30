// app/routes/index.ts
// 1. Export the primary routing view component
export { default as AppRoutes } from "./AppRoutes";

// 2. Export the compiled route data streams for layout configurations (like Sidebar/Navbar)
export { allRoutes, sidebarRoutes, GROUP_META } from "./routeConfig";

// 3. Export the TypeScript contracts so features can strongly type their individual route structures
export type { RouteConfig, SidebarGroup, SidebarIcon } from "./types";