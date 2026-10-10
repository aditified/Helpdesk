import type { Response } from "express";

export type SSEEventType = "ticket:created" | "ticket:updated" | "reply:created";

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}

interface SSEClient {
  id: string;
  res: Response;
  userId: string;
}

const clients = new Map<string, SSEClient>();

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function ensureHeartbeat(): void {
  if (heartbeatTimer) return;
  // Send keep-alive comment every 25 seconds
  heartbeatTimer = setInterval(() => {
    for (const [id, client] of clients.entries()) {
      try {
        client.res.write(": ping\n\n");
      } catch {
        clients.delete(id);
      }
    }
    if (clients.size === 0 && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }, 25000);
}

export function registerSSEClient(id: string, res: Response, userId: string): void {
  clients.set(id, { id, res, userId });
  ensureHeartbeat();
}

export function removeSSEClient(id: string): void {
  clients.delete(id);
}

export function broadcastSSE(event: SSEEvent): void {
  const payload = `event: message\ndata: ${JSON.stringify(event)}\n\n`;
  for (const [id, client] of clients.entries()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(id);
    }
  }
}

export function getConnectedClientCount(): number {
  return clients.size;
}
