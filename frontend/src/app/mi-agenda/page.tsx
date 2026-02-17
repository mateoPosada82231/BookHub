"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faSpinner,
  faClock,
  faUser,
  faScissors,
  faCheckCircle,
  faTimes,
  faExclamationTriangle,
  faStore,
  faArrowRight,
  faCheck,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { notify } from "@/components/ui/toast";
import { api } from "@/lib/api";
import Image from "next/image";
import { Worker, Appointment, Business } from "@/types";
import "@/styles/mi-agenda.css";

// Extract date from datetime string (ISO format)
function getDateFromDatetime(datetime: string): string {
  return datetime.split("T")[0];
}

// Format date to display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time to display (from ISO datetime)
function formatTime(datetime: string): string {
  const date = new Date(datetime);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get status badge class
function getStatusClass(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "status-confirmed";
    case "PENDING":
      return "status-pending";
    case "COMPLETED":
      return "status-completed";
    case "CANCELLED":
      return "status-cancelled";
    case "NO_SHOW":
      return "status-no-show";
    default:
      return "";
  }
}

// Get status label
function getStatusLabel(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "Confirmada";
    case "PENDING":
      return "Pendiente";
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    case "NO_SHOW":
      return "No asistió";
    default:
      return status;
  }
}

// Appointment Card Component
function AppointmentCard({
  appointment,
  onComplete,
  onNoShow,
  onCancel,
  isUpdating,
}: {
  appointment: Appointment;
  onComplete: (id: number) => void;
  onNoShow: (id: number) => void;
  onCancel: (id: number) => void;
  isUpdating: boolean;
}) {
  const isPast = new Date(appointment.end_time) < new Date();
  const canModify = !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
    appointment.status,
  );
  const appointmentDate = getDateFromDatetime(appointment.start_time);

  return (
    <div className={`appointment-card ${isPast ? "past" : ""}`}>
      <div className="appointment-header">
        <div className="appointment-date-time">
          <span className="appointment-date">
            <FontAwesomeIcon icon={faCalendarAlt} />
            {formatDate(appointmentDate)}
          </span>
          <span className="appointment-time">
            <FontAwesomeIcon icon={faClock} />
            {formatTime(appointment.start_time)} -{" "}
            {formatTime(appointment.end_time)}
          </span>
        </div>
        <span className={`status-badge ${getStatusClass(appointment.status)}`}>
          {getStatusLabel(appointment.status)}
        </span>
      </div>

      <div className="appointment-body">
        <div className="client-info">
          <FontAwesomeIcon icon={faUser} className="info-icon" />
          <div>
            <span className="info-label">Cliente</span>
            <span className="info-value">
              {appointment.client_name || "Cliente"}
            </span>
          </div>
        </div>

        <div className="service-info">
          <FontAwesomeIcon icon={faScissors} className="info-icon" />
          <div>
            <span className="info-label">Servicio</span>
            <span className="info-value">
              {appointment.service_name || "Servicio"}
            </span>
          </div>
        </div>

        <div className="price-info">
          <span className="price-label">Precio</span>
          <span className="price-value">
            $
            {(
              appointment.service_price ?? appointment.total_price
            )?.toLocaleString("es-CO") || "0"}
          </span>
        </div>
      </div>

      {canModify && (
        <div className="appointment-actions">
          <button
            className="btn-action btn-complete"
            onClick={() => onComplete(appointment.id)}
            disabled={isUpdating}
            title="Marcar como completada"
          >
            <FontAwesomeIcon icon={faCheck} />
            Completar
          </button>
          <button
            className="btn-action btn-no-show"
            onClick={() => onNoShow(appointment.id)}
            disabled={isUpdating}
            title="Cliente no asistió"
          >
            <FontAwesomeIcon icon={faExclamationTriangle} />
            No asistió
          </button>
          <button
            className="btn-action btn-cancel"
            onClick={() => onCancel(appointment.id)}
            disabled={isUpdating}
            title="Cancelar cita"
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            Cancelar
          </button>
        </div>
      )}

      {appointment.client_notes && (
        <div className="appointment-notes">
          <span className="notes-label">Notas:</span>
          <span className="notes-text">{appointment.client_notes}</span>
        </div>
      )}
    </div>
  );
}

// Main Content Component
function MiAgendaContent() {
  const router = useRouter();
  const [workerProfiles, setWorkerProfiles] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming",
  );
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<{
    appointmentId: number;
    status: "COMPLETED" | "NO_SHOW" | "CANCELLED";
    title: string;
    message: string;
  } | null>(null);

  // Load worker profiles on mount
  useEffect(() => {
    const loadWorkerProfiles = async () => {
      try {
        setLoading(true);
        const profiles = await api.getMyWorkerProfiles();
        setWorkerProfiles(profiles);

        if (profiles.length > 0) {
          setSelectedWorkerId(profiles[0].id);
        }
      } catch (err) {
        console.error("Error loading worker profiles:", err);
        setError("No se pudieron cargar tus perfiles de trabajador");
      } finally {
        setLoading(false);
      }
    };

    loadWorkerProfiles();
  }, []);

  // Load appointments when worker is selected
  const loadAppointments = useCallback(async () => {
    if (!selectedWorkerId) return;

    try {
      setLoadingAppointments(true);
      const data = await api.getUpcomingWorkerAppointments(selectedWorkerId);
      setAppointments(data);
    } catch (err) {
      console.error("Error loading appointments:", err);
      setError("No se pudieron cargar las citas");
    } finally {
      setLoadingAppointments(false);
    }
  }, [selectedWorkerId]);

  // Load appointments when worker changes
  useEffect(() => {
    if (selectedWorkerId) {
      loadAppointments();

      // Also load the business info for the selected worker
      const worker = workerProfiles.find((w) => w.id === selectedWorkerId);
      if (worker?.business_id) {
        api
          .getBusinessById(worker.business_id)
          .then((business) => setSelectedBusiness(business))
          .catch(console.error);
      }
    }
  }, [selectedWorkerId, workerProfiles, loadAppointments]);

  // Update appointment status
  const handleUpdateStatus = async (
    appointmentId: number,
    status: "COMPLETED" | "NO_SHOW" | "CANCELLED",
  ) => {
    try {
      setIsUpdating(true);
      if (status === "CANCELLED") {
        await api.cancelAppointment(appointmentId, "Cancelado por trabajador");
      } else {
        await api.updateAppointment(appointmentId, { status });
      }
      await loadAppointments();
      notify.success(
        status === "COMPLETED"
          ? "Cita marcada como completada"
          : status === "NO_SHOW"
            ? "Cita marcada como no asistió"
            : "Cita cancelada correctamente",
      );
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      notify.error(err.message || "No se pudo actualizar la cita");
    } finally {
      setIsUpdating(false);
      setConfirmAction(null);
    }
  };

  // Request confirmation before updating
  const requestStatusUpdate = (
    appointmentId: number,
    status: "COMPLETED" | "NO_SHOW" | "CANCELLED",
  ) => {
    const configs = {
      COMPLETED: {
        title: "Completar cita",
        message: "¿Confirmas que esta cita fue completada exitosamente?",
      },
      NO_SHOW: {
        title: "Marcar como no asistió",
        message: "¿Confirmas que el cliente no asistió a esta cita?",
      },
      CANCELLED: {
        title: "Cancelar cita",
        message:
          "¿Estás seguro de cancelar esta cita? Se notificará al cliente.",
      },
    };
    setConfirmAction({
      appointmentId,
      status,
      ...configs[status],
    });
  };

  // Group appointments by date
  const groupedAppointments = appointments.reduce(
    (groups, appointment) => {
      const date = getDateFromDatetime(appointment.start_time);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    },
    {} as Record<string, Appointment[]>,
  );

  // Sort dates
  const sortedDates = Object.keys(groupedAppointments).sort();

  // Today's appointments
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = groupedAppointments[today] || [];

  // Loading state
  if (loading) {
    return (
      <LoadingSpinner size="lg" message="Cargando tu agenda..." fullScreen />
    );
  }

  // No worker profiles state
  if (workerProfiles.length === 0) {
    return (
      <div className="mi-agenda-container">
        <Navbar />
        <main className="mi-agenda-main">
          <div className="mi-agenda-content">
            <div className="empty-state-container">
              <div className="empty-state-icon">
                <FontAwesomeIcon icon={faStore} />
              </div>
              <h2>No estás asignado a ningún negocio</h2>
              <p>
                Contacta con el dueño de una barbería o peluquería para que te
                agregue como trabajador.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mi-agenda-container">
      <Navbar />
      <main className="mi-agenda-main">
        <div className="mi-agenda-content">
          {/* Header */}
          <div className="mi-agenda-header">
            <div>
              <h1 className="page-title">Mi Agenda</h1>
              <p className="page-subtitle">
                Gestiona tus citas y tu horario de trabajo
              </p>
            </div>
          </div>

          {/* Worker selector if multiple */}
          {workerProfiles.length > 1 && (
            <div className="worker-selector">
              {workerProfiles.map((profile) => (
                <button
                  key={profile.id}
                  className={`worker-selector-item ${
                    selectedWorkerId === profile.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedWorkerId(profile.id)}
                >
                  <FontAwesomeIcon icon={faStore} />
                  {profile.business_name || `Negocio ${profile.business_id}`}
                </button>
              ))}
            </div>
          )}

          {/* Business info card */}
          {selectedBusiness && (
            <div className="business-info-card">
              <div className="business-info-image">
                {selectedBusiness.cover_image_url ? (
                  <Image
                    src={selectedBusiness.cover_image_url}
                    alt={selectedBusiness.name}
                    fill
                    sizes="120px"
                    loading="lazy"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="business-info-placeholder">
                    <FontAwesomeIcon icon={faStore} />
                  </div>
                )}
              </div>
              <div className="business-info-content">
                <span className="business-info-category">
                  {selectedBusiness.category}
                </span>
                <h2 className="business-info-name">{selectedBusiness.name}</h2>
                <p className="business-info-address">
                  {selectedBusiness.address}
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="error-message">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {error}
              <button onClick={() => setError(null)} className="error-close">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}

          {/* Stats summary */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
              <span className="stat-value">{todayAppointments.length}</span>
              <span className="stat-label">Citas hoy</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <span className="stat-value">{appointments.length}</span>
              <span className="stat-label">Próximas citas</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <span className="stat-value">
                {appointments.filter((a) => a.status === "CONFIRMED").length}
              </span>
              <span className="stat-label">Confirmadas</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-orange">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <span className="stat-value">
                {appointments.filter((a) => a.status === "PENDING").length}
              </span>
              <span className="stat-label">Pendientes</span>
            </div>
          </div>

          {/* Appointments section */}
          <div className="appointments-container">
            <div className="tabs">
              <button
                className={`tab ${activeTab === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveTab("upcoming")}
              >
                <FontAwesomeIcon icon={faArrowRight} />
                Próximas citas
              </button>
              <button
                className={`tab ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                <FontAwesomeIcon icon={faClock} />
                Historial
              </button>
            </div>

            <div className="tab-content">
              {loadingAppointments ? (
                <div className="loading-appointments">
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Cargando citas...</span>
                </div>
              ) : appointments.length === 0 ? (
                <div className="empty-appointments">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <h3>No hay citas programadas</h3>
                  <p>
                    Las citas de tus clientes aparecerán aquí cuando las
                    reserven.
                  </p>
                </div>
              ) : (
                <div className="appointments-list">
                  {sortedDates.map((date) => (
                    <div key={date} className="date-group">
                      <h3 className="date-header">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {formatDate(date)}
                        {date === today && (
                          <span className="today-badge">Hoy</span>
                        )}
                      </h3>
                      <div className="date-appointments">
                        {groupedAppointments[date]
                          .sort((a, b) =>
                            a.start_time.localeCompare(b.start_time),
                          )
                          .map((appointment) => (
                            <AppointmentCard
                              key={appointment.id}
                              appointment={appointment}
                              onComplete={(id) =>
                                requestStatusUpdate(id, "COMPLETED")
                              }
                              onNoShow={(id) =>
                                requestStatusUpdate(id, "NO_SHOW")
                              }
                              onCancel={(id) =>
                                requestStatusUpdate(id, "CANCELLED")
                              }
                              isUpdating={isUpdating}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction) {
            handleUpdateStatus(
              confirmAction.appointmentId,
              confirmAction.status,
            );
          }
        }}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        confirmText={
          confirmAction?.status === "COMPLETED"
            ? "Completar"
            : confirmAction?.status === "NO_SHOW"
              ? "Confirmar"
              : "Cancelar cita"
        }
        variant={
          confirmAction?.status === "CANCELLED"
            ? "danger"
            : confirmAction?.status === "NO_SHOW"
              ? "warning"
              : "info"
        }
        loading={isUpdating}
      />
    </div>
  );
}

// Main page with protection
export default function MiAgendaPage() {
  return (
    <ProtectedRoute allowedRoles={["WORKER", "OWNER"]}>
      <MiAgendaContent />
    </ProtectedRoute>
  );
}
