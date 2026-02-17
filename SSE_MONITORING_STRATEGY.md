# SSE Monitoring Strategy

Monitoring Server-Sent Events (SSE) requires a different approach than standard REST endpoints due to their long-lived, unidirectional nature.

## 核心策略 (Core Strategy)

### 1. Persistent Connection Management
- **SSE Manager Service**: A dedicated service to manage active `EventSource` or streaming HTTP connections.
- **Auto-Reconnect**: Robust logic to handle network jitter and server-side timeouts (Exponential Backoff).
- **Resource Protection**: Limit total active streams to avoid hitting file descriptor or browser connection limits.

### 2. Event-Driven Monitoring
- **Heartbeat Detection**: If the server sends periodic `:keep-alive` comments or dummy events, track them to ensure the link is "hot."
- **Event Logging**: Record every received event as a `MonitorLog` with `method: "SSE"`.
- **Latency Tracking**: If events include server-side timestamps, calculate the delay until client receipt.

### 3. Data Integrity & Compliance
- **Real-time Validation**: Use the existing `Ajv` validation engine to verify the payload of every event against its OpenAPI schema.
- **Trend Analysis**: Monitor the frequency of specific event types (e.g., if `status` changes stop happening for a frequently used device, trigger an alert).

### 4. UI Dashboard
- **Live Stream Viewer**: A dedicated tab showing active connections, their uptime, and a scrolling feed of raw events.
- **Stability Metrics**: Display "Drops per hour" and "Average Event Frequency."

## Technical Implementation Plan

1. **Backend**:
   - Install `eventsource` or implement custom stream parsing in `MonitorEngineService`.
   - Create `MonitorSSEService` to manage multiple background connections.
   - Extend `MonitorLog` entity to support `SSE` method and event-specific metadata.

2. **Frontend**:
   - New "Live Streams" tab in the dashboard.
   - Visual indicators for "Streaming" vs "Stalled" state.
