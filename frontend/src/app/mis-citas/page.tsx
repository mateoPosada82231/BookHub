"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronRight,
  Store,
  Scissors,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  CalendarDays,
  History,
  Star,
} from "lucide-react";
import { LoadingSpinner, Modal } from "@/components/ui";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Appointment, CreateReviewRequest } from "@/types";
import { notify } from "@/components/ui/toast";
import { ReviewForm } from "@/components/ReviewForm";
import "@/styles/mis-citas.css";
import "@/styles/reviews.css";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return {
        className: "status-confirmed",
        label: "Confirmada",
        icon: CheckCircle,
      };
    case "PENDING":
      return { className: "status-pending", label: "Pendiente", icon: Clock };
    case "COMPLETED":
      return {
        className: "status-completed",
        label: "Completada",
        icon: CheckCircle,
      };
    case "CANCELLED":
      return { className: "status-cancelled", label: "Cancelada", icon: X };
    case "NO_SHOW":
      return {
        className: "status-no-show",
        label: "No asistió",
        icon: AlertCircle,
      };
    default:
      return { className: "status-pending", label: status, icon: Clock };
  }
};

function formatDateParts(dateString: string) {
  // Parse date parts directly from ISO string to avoid UTC timezone conversion
  const dateOnly = dateString.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString("es-ES", { month: "short" }),
    weekday: date.toLocaleDateString("es-ES", { weekday: "short" }),
  };
}

function formatTime(dateString: string): string {
  // Extract HH:MM directly from ISO datetime to avoid timezone shifts
  const timePart = dateString.split("T")[1];
  if (timePart) {
    return timePart.substring(0, 5);
  }
  return dateString;
}

function isUpcoming(dateString: string): boolean {
  // Parse datetime directly to avoid timezone issues
  const dateOnly = dateString.split("T")[0];
  const timePart = dateString.split("T")[1] || "00:00:00";
  const [year, month, day] = dateOnly.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  return date > new Date();
}

function MisCitasContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAppointment, setReviewAppointment] =
    useState<Appointment | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.getMyAppointments(0, 50);
      setAppointments(response.content || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleReviewClick = (appointment: Appointment) => {
    setReviewAppointment(appointment);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (data: CreateReviewRequest) => {
    if (!reviewAppointment) return;

    await api.createReview(reviewAppointment.id, data);
    await loadAppointments();
    setShowReviewModal(false);
    setReviewAppointment(null);
    notify.success("¡Reseña enviada correctamente!");
  };

  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;

    setCancellingId(selectedAppointment.id);
    try {
      await api.cancelAppointment(
        selectedAppointment.id,
        cancelReason || undefined,
      );
      await loadAppointments();
      setShowCancelModal(false);
      setSelectedAppointment(null);
      notify.success("Cita cancelada correctamente");
    } catch (err: any) {
      const errorMessage = err.message || "Error al cancelar la cita";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return null;
  }

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter(
        (apt) =>
          isUpcoming(apt.start_time) &&
          apt.status !== "CANCELLED" &&
          apt.status !== "COMPLETED",
      ),
    [appointments],
  );

  const pastAppointments = useMemo(
    () =>
      appointments.filter(
        (apt) =>
          !isUpcoming(apt.start_time) ||
          apt.status === "CANCELLED" ||
          apt.status === "COMPLETED",
      ),
    [appointments],
  );

  const pendingCount = useMemo(
    () => appointments.filter((apt) => apt.status === "PENDING").length,
    [appointments],
  );

  const displayAppointments = useMemo(
    () => (activeTab === "upcoming" ? upcomingAppointments : pastAppointments),
    [activeTab, upcomingAppointments, pastAppointments],
  );

  return (
    <div className="mis-citas-page">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="mis-citas-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mis-citas-header"
          >
            <div>
              <h1 className="mis-citas-title">Mis Citas</h1>
              <p className="mis-citas-subtitle">
                Gestiona tus reservas y citas programadas
              </p>
            </div>
            <button
              onClick={loadAppointments}
              disabled={loading}
              className="btn-refresh"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} />
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mis-citas-stats"
          >
            <div className="stat-card">
              <div className="stat-card-icon upcoming">
                <CalendarDays size={20} />
              </div>
              <div className="stat-value">{upcomingAppointments.length}</div>
              <div className="stat-label">Próximas</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon history">
                <History size={20} />
              </div>
              <div className="stat-value">{pastAppointments.length}</div>
              <div className="stat-label">Historial</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon pending">
                <Clock size={20} />
              </div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Pendientes</div>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="error-banner"
              >
                <AlertCircle size={20} />
                <span>{error}</span>
                <button onClick={() => setError(null)}>
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mis-citas-tabs"
          >
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`tab-button ${activeTab === "upcoming" ? "active" : ""}`}
            >
              <CalendarDays size={18} />
              Próximas
              <span className="tab-count">{upcomingAppointments.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`tab-button ${activeTab === "past" ? "active" : ""}`}
            >
              <History size={18} />
              Historial
              <span className="tab-count">{pastAppointments.length}</span>
            </button>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <LoadingSpinner
              size="lg"
              message="Cargando tus citas..."
              fullScreen
            />
          )}

          {/* Appointments List */}
          {!loading && displayAppointments.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="appointments-list"
            >
              {displayAppointments.map((appointment) => {
                const statusConfig = getStatusConfig(appointment.status);
                const StatusIcon = statusConfig.icon;
                const dateParts = formatDateParts(appointment.start_time);

                return (
                  <motion.div
                    key={appointment.id}
                    variants={fadeIn}
                    className="appointment-card"
                  >
                    <div className="appointment-card-inner">
                      {/* Date Column */}
                      <div className="appointment-date-col">
                        <span className="appointment-day">{dateParts.day}</span>
                        <span className="appointment-month">
                          {dateParts.month}
                        </span>
                        <span className="appointment-weekday">
                          {dateParts.weekday}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="appointment-content">
                        <div className="appointment-header">
                          <div className="appointment-business">
                            <div className="business-avatar">
                              <Store />
                            </div>
                            <div className="business-info">
                              <h3>{appointment.business_name}</h3>
                              <p>{appointment.service_name}</p>
                            </div>
                          </div>
                          <span
                            className={`status-badge ${statusConfig.className}`}
                          >
                            <StatusIcon />
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="appointment-details">
                          <div className="detail-item">
                            <Clock />
                            <span>
                              {formatTime(appointment.start_time)} -{" "}
                              {formatTime(appointment.end_time)}
                            </span>
                          </div>
                          <div className="detail-item">
                            <User />
                            <span>{appointment.worker_name}</span>
                          </div>
                          {appointment.business_address && (
                            <div className="detail-item">
                              <MapPin />
                              <span>{appointment.business_address}</span>
                            </div>
                          )}
                        </div>

                        <div className="appointment-footer">
                          <div className="appointment-price">
                            <span className="appointment-price-label">
                              Total
                            </span>
                            $
                            {(
                              appointment.total_price ||
                              appointment.service_price ||
                              0
                            ).toLocaleString("es-CO")}
                          </div>
                          <div className="appointment-actions">
                            {/* Review button for completed appointments without review */}
                            {appointment.status === "COMPLETED" &&
                              !appointment.has_review && (
                                <button
                                  onClick={() => handleReviewClick(appointment)}
                                  className="btn-review"
                                >
                                  <Star size={16} />
                                  Dejar reseña
                                </button>
                              )}
                            {/* Badge for already reviewed appointments */}
                            {appointment.status === "COMPLETED" &&
                              appointment.has_review && (
                                <span className="review-badge">
                                  <CheckCircle size={14} />
                                  Reseña enviada
                                </span>
                              )}
                            {activeTab === "upcoming" &&
                              appointment.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleCancelClick(appointment)}
                                  disabled={cancellingId === appointment.id}
                                  className="btn-cancel"
                                >
                                  {cancellingId === appointment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Cancelar"
                                  )}
                                </button>
                              )}
                            <button
                              onClick={() =>
                                router.push(
                                  `/negocio/${appointment.business_id}`,
                                )
                              }
                              className="btn-view"
                            >
                              Ver negocio
                              <ChevronRight />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && displayAppointments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="empty-state"
            >
              <div className="empty-state-icon">
                <Calendar />
              </div>
              <h3>
                {activeTab === "upcoming"
                  ? "No tienes citas programadas"
                  : "No tienes citas anteriores"}
              </h3>
              <p>
                {activeTab === "upcoming"
                  ? "Explora los mejores establecimientos y reserva tu próxima cita"
                  : "Tu historial de citas aparecerá aquí cuando tengas citas completadas"}
              </p>
              {activeTab === "upcoming" && (
                <button
                  onClick={() => router.push("/")}
                  className="btn-explore"
                >
                  Explorar lugares
                </button>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal && !!selectedAppointment}
        onClose={() => setShowCancelModal(false)}
        title="Cancelar cita"
        size="sm"
      >
        {selectedAppointment && (
          <div style={{ padding: "0 1.75rem 1.75rem" }}>
            <div className="modal-header">
              <div className="modal-icon">
                <AlertCircle />
              </div>
              <div>
                <p className="modal-subtitle">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="modal-appointment-info">
              <strong>{selectedAppointment.service_name}</strong>
              <span>
                {formatDateParts(selectedAppointment.start_time).day}{" "}
                {formatDateParts(selectedAppointment.start_time).month} a las{" "}
                {formatTime(selectedAppointment.start_time)}
              </span>
            </div>

            <label
              style={{
                display: "block",
                color: "#a3a3a3",
                fontSize: "0.875rem",
                marginBottom: "0.5rem",
              }}
            >
              Motivo de cancelación (opcional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Cuéntanos por qué cancelas..."
              className="modal-textarea"
              rows={3}
            />

            <div className="modal-actions">
              <button
                onClick={() => setShowCancelModal(false)}
                className="modal-btn modal-btn-secondary"
              >
                Volver
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
                className="modal-btn modal-btn-danger"
              >
                {cancellingId !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  "Confirmar cancelación"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <ReviewForm
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewAppointment(null);
        }}
        onSubmit={handleSubmitReview}
        appointmentInfo={
          reviewAppointment
            ? {
                serviceName: reviewAppointment.service_name,
                businessName: reviewAppointment.business_name,
                workerName: reviewAppointment.worker_name,
                date: reviewAppointment.start_time,
              }
            : undefined
        }
      />
    </div>
  );
}

export default function MisCitasPage() {
  return (
    <ProtectedRoute>
      <MisCitasContent />
    </ProtectedRoute>
  );
}
