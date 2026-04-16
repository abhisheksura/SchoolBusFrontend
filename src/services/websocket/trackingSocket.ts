// services/websocket/trackingSocket.ts
// WebSocket client for live bus GPS position updates.
// Used by the trip live-tracking page as a drop-in replacement for
// the polling approach once the backend supports WebSockets.
//
// Currently a stub — swap the connect() body with a real WS URL when ready.

type PositionHandler = (data: {
    trip_id: number;
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    last_updated: string;
}) => void;

class TrackingSocket {
    private socket: WebSocket | null = null;
    private handlers: Set<PositionHandler> = new Set();

    connect(tripId: number, token: string): void {
        const wsBase = import.meta.env.VITE_WS_BASE_URL ?? "ws://127.0.0.1:8000";
        const url = `${wsBase}/ws/trips/${tripId}/track?token=${token}`;

        this.socket = new WebSocket(url);

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data as string);
                this.handlers.forEach((handler) => handler(data));
            } catch {
                console.error("[TrackingSocket] Failed to parse message", event.data);
            }
        };

        this.socket.onerror = (err) => {
            console.error("[TrackingSocket] Error", err);
        };
    }

    disconnect(): void {
        this.socket?.close();
        this.socket = null;
    }

    onPosition(handler: PositionHandler): () => void {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }
}

// Singleton instance — one socket connection shared across the app
export const trackingSocket = new TrackingSocket();