"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  ArrowDown,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Notification } from "@/types";
import { notify } from "@/components/ui/toast";
import { useNotifications } from "@/context/NotificationContext";
import "@/styles/notificaciones.css";

const PAGE_SIZE = 20;

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function NotificationsContent() {
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadNotifications = async (
    nextPage = 0,
    append = false,
    silent = false,
  ) => {
    if (!silent) {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
    }
    setError(null);

    try {
      const response = await api.getMyNotifications(nextPage, PAGE_SIZE);
      setNotifications((prev) =>
        append ? [...prev, ...response.content] : response.content,
      );
      setPage(response.current_page);
      setHasMore(!response.last);
    } catch (err: unknown) {
      setError(errorMessage(err, "No se pudieron cargar las notificaciones"));
    } finally {
      if (!silent) {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    // Si llega un evento SSE y cambia el contador, refrescamos en segundo plano
    // para mantener la lista alineada sin bloquear la UI.
    loadNotifications(0, false, true);
  }, [unreadCount]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) {
      return;
    }

    try {
      await api.markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item,
        ),
      );
      await refreshUnreadCount();
    } catch (err: unknown) {
      notify.error(errorMessage(err, "No se pudo marcar la notificación"));
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const result = await api.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        })),
      );
      await refreshUnreadCount();
      notify.success(
        result.updated_count > 0
          ? `${result.updated_count} notificaciones marcadas como leidas`
          : "No habia notificaciones pendientes",
      );
    } catch (err: unknown) {
      notify.error(errorMessage(err, "No se pudieron marcar todas como leidas"));
    } finally {
      setMarkingAll(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) {
      return;
    }
    await loadNotifications(page + 1, true);
  };

  return (
    <div className="notificaciones-page">
      <Navbar />

      <main className="notificaciones-main">
        <div className="notificaciones-container">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="notificaciones-header"
          >
            <div>
              <h1 className="notificaciones-title">
                <Bell className="h-5 w-5" />
                Notificaciones
              </h1>
              <p className="notificaciones-subtitle">
                {unreadCount > 0
                  ? `Tienes ${unreadCount} sin leer`
                  : "No tienes pendientes"}
              </p>
            </div>

            <div className="notificaciones-actions">
              <button
                onClick={() => loadNotifications()}
                className="notificaciones-btn notificaciones-btn-secondary"
                disabled={loading}
              >
                <RefreshCw className={loading ? "animate-spin" : ""} />
                Recargar
              </button>
              <button
                onClick={handleMarkAllAsRead}
                className="notificaciones-btn notificaciones-btn-primary"
                disabled={markingAll || unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4" />
                {markingAll ? "Marcando..." : "Marcar todas"}
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="notificaciones-error"
              >
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="notificaciones-loading">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className="notificaciones-empty">
              <Bell className="h-8 w-8" />
              <h3>Sin notificaciones</h3>
              <p>
                Cuando tengas novedades de tus citas, apareceran aqui en tiempo
                real.
              </p>
            </div>
          ) : (
            <>
              <div className="notificaciones-list">
                {notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`notificaciones-item ${notification.is_read ? "is-read" : "is-unread"}`}
                  >
                    <div className="notificaciones-item-content">
                      <h3>{notification.title}</h3>
                      <p>{notification.message}</p>
                      <span>
                        {new Date(notification.created_at).toLocaleString("es-ES")}
                      </span>
                    </div>
                    <div className="notificaciones-item-actions">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification)}
                          className="notificaciones-btn notificaciones-btn-inline"
                        >
                          <Check className="h-4 w-4" />
                          Marcar leida
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="notificaciones-load-more"
                >
                  <ArrowDown className={`h-4 w-4 ${loadingMore ? "animate-bounce" : ""}`} />
                  {loadingMore ? "Cargando..." : "Cargar mas"}
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
