
export interface BusResponse {
    bus_id     : number;
    school_id  : number;
    branch_id  : number;
    school_name: string;   // denormalised
    branch_name: string;   // denormalised
    bus_number : string;   // unique per school, e.g. "RT-001"
    capacity   : number;
    is_active  : boolean;
    created_at : string;
    updated_at : string;
}

/** POST /buses — tenant fields required. */
export interface BusCreateRequest {
    school_id : number;
    branch_id : number;
    bus_number: string;
    capacity  : number;
}

/** PUT /routes/:id — tenant fields excluded. */
export interface BusUpdateRequest {
    bus_number?: string;
    capacity  ?: number;
    is_active ?: boolean;
}