// services/maps/leafletConfig.ts
// Centralised Leaflet tile layer config.
// React Leaflet has SSR issues — always lazy-import map components.
//
// Usage in a page:
//   const LiveMap = lazy(() => import("@/services/maps/LiveMap"));

export const TILE_LAYER = {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
} as const;

export const DEFAULT_CENTER: [number, number] = [17.385, 78.4867]; // Hyderabad
export const DEFAULT_ZOOM = 13;

export const BUS_ICON_OPTIONS = {
    iconUrl: "/icons/bus-marker.png",
    iconSize: [32, 32] as [number, number],
    iconAnchor: [16, 32] as [number, number],
    popupAnchor: [0, -32] as [number, number],
};