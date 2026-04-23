"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuth } from "@/context/AuthContext";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.unread_count ?? 0);
    } catch {
      // Ignore transient errors to avoid noisy UX.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      closeStream();
      return;
    }

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      closeStream();
      const eventSource = new EventSource(notificationsApi.streamUrl(), {
        withCredentials: true,
      });
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("unread_count", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as { unread_count?: number };
          if (typeof payload.unread_count === "number") {
            setUnreadCount(payload.unread_count);
          }
        } catch {
          // Ignore malformed event payloads.
        }
      });

      eventSource.onerror = () => {
        eventSource.close();
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      closeStream();
    };
  }, [isAuthenticated, isLoading, refreshUnreadCount, closeStream]);

  const value = useMemo(
    () => ({ unreadCount, refreshUnreadCount }),
    [unreadCount, refreshUnreadCount],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
