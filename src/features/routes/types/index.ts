// src/features/routes/types/index.ts

// 1. Export from common.types
export type { TripType } from "./common.types";

// 2. Export from routes.types (Fixed with 'type' modifier)
export type { 
    RouteResponse, 
    RouteCreateRequest, 
    RouteUpdateRequest,
    RouteFilters
} from "./routes.types";

export type {
    RouteStop,
    RouteWithStops,
    RouteStopCreateRequest,
    RouteStopUpdateRequest,
    RouteStopReorderRequest,
    RouteStopWithDetails,
} from "./route-stops.types";

export type {
    StopResponse,
    StopCreateRequest,
    StopUpdateRequest,
    StopFilters
} from "./stops.types";