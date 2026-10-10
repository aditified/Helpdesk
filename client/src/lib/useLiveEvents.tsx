import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "./auth-client";

export interface LiveNotification {
  id: string;
  type: "ticket:created" | "ticket:updated" | "reply:created";
  title: string;
  description: string;
  ticketId?: number;
}

interface LiveEventsContextType {
  isConnected: boolean;
  notifications: LiveNotification[];
  dismissNotification: (id: string) => void;
}

const LiveEventsContext = createContext<LiveEventsContextType>({
  isConnected: false,
  notifications: [],
  dismissNotification: () => {},
});

export function LiveEventsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<LiveNotification, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: LiveNotification = { ...notification, id };
    setNotifications((prev) => [item, ...prev].slice(0, 5));

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  useEffect(() => {
    // Only connect when user is logged in and EventSource is supported
    if (!session?.user || typeof EventSource === "undefined") {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const es = new EventSource("/api/events", { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setIsConnected(true);
    });

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        if (type === "ticket:created") {
          // Invalidate queries so dashboard and table update automatically
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
          queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
          queryClient.invalidateQueries({ queryKey: ["ticket-daily-volume"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-recent-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-resolved-count"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-closed-count"] });

          // Also invalidate i-Tickets queries
          queryClient.invalidateQueries({ queryKey: ["i-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["i-ticket-stats"] });
          queryClient.invalidateQueries({ queryKey: ["recent-i-tickets"] });

          const isInsta = data?.channel === "instagram";
          addNotification({
            type: "ticket:created",
            title: isInsta
              ? `New Instagram DM ${data.username ? `(@${data.username})` : ""}`
              : `New Ticket #${data.id}`,
            description: data.subject || "New inbound support request",
            ticketId: data.id,
          });
        } else if (type === "ticket:updated") {
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
          queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
          queryClient.invalidateQueries({ queryKey: ["ticket-daily-volume"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-recent-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-resolved-count"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-closed-count"] });

          // Also invalidate i-Tickets queries
          queryClient.invalidateQueries({ queryKey: ["i-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["i-ticket-stats"] });
          queryClient.invalidateQueries({ queryKey: ["recent-i-tickets"] });

          if (data?.id) {
            queryClient.invalidateQueries({ queryKey: ["ticket", String(data.id)] });
            queryClient.invalidateQueries({ queryKey: ["ticket", Number(data.id)] });
            queryClient.invalidateQueries({ queryKey: ["i-ticket", String(data.id)] });
          }

          if (data?.channel === "instagram" && data?.lastMessage) {
            addNotification({
              type: "ticket:updated",
              title: `Instagram DM Updated (@${data.username || "user"})`,
              description: data.lastMessage,
              ticketId: data.id,
            });
          } else if (data?.status === "resolved") {
            addNotification({
              type: "ticket:updated",
              title: `Ticket #${data.id} Resolved`,
              description: "Ticket marked as resolved",
              ticketId: data.id,
            });
          }
        } else if (type === "reply:created") {
          if (data?.ticketId) {
            queryClient.invalidateQueries({ queryKey: ["replies", String(data.ticketId)] });
            queryClient.invalidateQueries({ queryKey: ["replies", Number(data.ticketId)] });
            queryClient.invalidateQueries({ queryKey: ["ticket", String(data.ticketId)] });
            queryClient.invalidateQueries({ queryKey: ["ticket", Number(data.ticketId)] });
            queryClient.invalidateQueries({ queryKey: ["i-ticket", String(data.ticketId)] });
          }
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
          queryClient.invalidateQueries({ queryKey: ["ticket-stats"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-recent-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["i-tickets"] });
          queryClient.invalidateQueries({ queryKey: ["i-ticket-stats"] });

          addNotification({
            type: "reply:created",
            title: `New Reply on #${data.ticketId}`,
            description: `From ${data.senderName ?? (data.senderType === "agent" ? "Agent" : "Customer")}`,
            ticketId: data.ticketId,
          });
        }
      } catch (err) {
        console.error("[SSE] Failed to process incoming event:", err);
      }
    };

    es.onerror = () => {
      // Browser EventSource automatically attempts reconnection
      setIsConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [session?.user, queryClient, addNotification]);

  return (
    <LiveEventsContext.Provider
      value={{ isConnected, notifications, dismissNotification }}
    >
      {children}
    </LiveEventsContext.Provider>
  );
}

export function useLiveEvents() {
  return useContext(LiveEventsContext);
}
