"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Loader2,
  Clock,
  User,
  Scissors,
  CheckCircle,
  X,
  AlertTriangle,
  Store,
  ArrowRight,
  Check,
  XCircle,
} from "lucide-react";
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

// Format date to display - parses date parts directly to avoid UTC timezone issues
function formatDate(dateString: string): string {
  // Parse YYYY-MM-DD directly to avoid UTC conversion shifting the day
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time to display (from ISO datetime) - extracts HH:MM directly
function formatTime(datetime: string): string {
  const timePart = datetime.split("T")[1];
  if (timePart) {
    return timePart.substring(0, 5);
  }
  return datetime;
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
const AppointmentCard = memo(function AppointmentCard({
  appointment,
  onConfirm,
  onComplete,
  onNoShow,
  onCancel,
  isUpdating,
}: {
  appointment: Appointment;
  onConfirm: (id: number) => void;
  onComplete: (id: number) => void;
  onNoShow: (id: number) => void;
  onCancel: (id: number) => void;
  isUpdating: boolean;
}) {
  const isPast = (() => {
    const dateOnly = appointment.end_time.split("T")[0];
    const timePart = appointment.end_time.split("T")[1] || "00:00:00";
    const [year, month, day] = dateOnly.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute) < new Date();
  })();
  const canModify = !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
    appointment.status,
  );
  const appointmentDate = getDateFromDatetime(appointment.start_time);

  return (
    <div className={`appointment-card ${isPast ? "past" : ""}`}>
      <div className="appointment-header">
        <div className="appointment-date-time">
          <span className="appointment-date">
            <Calendar size={14} />
            {formatDate(appointmentDate)}
          </span>
          <span className="appointment-time">
            <Clock size={14} />
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
          <User size={16} className="info-icon" />
          <div>
            <span className="info-label">Cliente</span>
            <span className="info-value">
              {appointment.client_name || "Cliente"}
            </span>
          </div>
        </div>

        <div className="service-info">
          <Scissors size={16} className="info-icon" />
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
          {appointment.status === "PENDING" && (
            <button
              className="btn-action btn-complete"
              onClick={() => onConfirm(appointment.id)}
              disabled={isUpdating}
              title="Confirmar cita"
            >
              <Check size={14} />
              Confirmar
            </button>
          )}
          {appointment.status === "CONFIRMED" && (
            <>
              <button
                className="btn-action btn-complete"
                onClick={() => onComplete(appointment.id)}
                disabled={isUpdating}
                title="Marcar como completada"
              >
                <Check size={14} />
                Completar
              </button>
              <button
                className="btn-action btn-no-show"
                onClick={() => onNoShow(appointment.id)}
                disabled={isUpdating}
                title="Cliente no asistió"
              >
                <AlertTriangle size={14} />
                No asistió
              </button>
            </>
          )}
          <button
            className="btn-action btn-cancel"
            onClick={() => onCancel(appointment.id)}
            disabled={isUpdating}
            title="Cancelar cita"
          >
            <XCircle size={14} />
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
});

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
    status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
    title: string;
    message: string;
    variant: "danger" | "warning" | "info" | "success";
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
      // Load all appointments (paginated) to support both upcoming and history tabs
      const data = await api.getWorkerAppointments(selectedWorkerId, 0, 100);
      setAppointments(data.content || []);
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
          .then(setSelectedBusiness)
          .catch(() => setSelectedBusiness(null));
      } else {
        setSelectedBusiness(null);
      }
    }
  }, [selectedWorkerId, workerProfiles, loadAppointments]);

  const handleUpdateStatus = async () => {
    if (!confirmAction) return;

    setIsUpdating(true);
    try {
      await api.updateAppointment(confirmAction.appointmentId, {
        status: confirmAction.status,
      });
      notify.success(
        `Cita ${
          confirmAction.status === "CONFIRMED"
            ? "confirmada"
            : confirmAction.status === "COMPLETED"
              ? "completada"
              : confirmAction.status === "CANCELLED"
                ? "cancelada"
                : "marcada como no asistida"
        }
        con éxito`,
      );
      await loadAppointments(); // Refresh appointments
    } catch (err) {
      console.error("Error updating status:", err);
      notify.error("Error al actualizar el estado de la cita");
    } finally {
      setIsUpdating(false);
      setConfirmAction(null);
    }
  };

  const openConfirmDialog = (
    appointmentId: number,
    status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED",
  ) => {
    let title = "Confirmar Acción";
    let message = "¿Estás seguro de que deseas realizar esta acción?";
    let variant: "danger" | "warning" | "info" | "success" = "info";

    switch (status) {
      case "CONFIRMED":
        title = "Confirmar Cita";
        message = "¿Estás seguro de que quieres confirmar esta cita?";
        variant = "success";
        break;
      case "COMPLETED":
        title = "Completar Cita";
        message = "Confirma que el servicio se ha completado con éxito.";
        variant = "success";
        break;
      case "NO_SHOW":
        title = "Marcar como No Asistió";
        message =
          "¿Estás seguro de que el cliente no asistió a la cita? Esta acción no se puede deshacer.";
        variant = "warning";
        break;
      case "CANCELLED":
        title = "Cancelar Cita";
        message =
          "¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer.";
        variant = "danger";
        break;
    }

    setConfirmAction({ appointmentId, status, title, message, variant });
  };

  // Filter appointments for upcoming and history tabs
  const { upcoming: upcomingAppointments, history: historyAppointments } =
    useMemo(() => {
      const now = new Date();
      const parseLocal = (dt: string) => {
        const [datePart, timePart = "00:00:00"] = dt.split("T");
        const [y, m, d] = datePart.split("-").map(Number);
        const [h, min] = timePart.split(":").map(Number);
        return new Date(y, m - 1, d, h, min);
      };
      return {
        upcoming: appointments.filter(
          (apt) =>
            parseLocal(apt.start_time) >= now &&
            apt.status !== "CANCELLED" &&
            apt.status !== "COMPLETED" &&
            apt.status !== "NO_SHOW",
        ),
        history: appointments.filter(
          (apt) =>
            parseLocal(apt.start_time) < now ||
            apt.status === "CANCELLED" ||
            apt.status === "COMPLETED" ||
            apt.status === "NO_SHOW",
        ),
      };
    }, [appointments]);

  const displayedAppointments =
    activeTab === "upcoming" ? upcomingAppointments : historyAppointments;

  const groupedAppointments = useMemo(() => {
    const groups: Record<string, typeof displayedAppointments> = {};
    for (const apt of displayedAppointments) {
      const date = getDateFromDatetime(apt.start_time);
      (groups[date] ??= []).push(apt);
    }
    return groups;
  }, [displayedAppointments]);

  const sortedDates = useMemo(
    () =>
      Object.keys(groupedAppointments).sort((a, b) =>
        activeTab === "history" ? b.localeCompare(a) : a.localeCompare(b),
      ),
    [groupedAppointments, activeTab],
  );

  // Today's appointments - use local date to match getDateFromDatetime
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
                <Store size={32} />
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
                  <Store size={16} />
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
                    <Store size={24} />
                  </div>
                )}
              </div>
              <div className="business-info-content">
                <span className="business-info-category">
                  {selectedBusiness.category_display ||
                    selectedBusiness.category}
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
              <AlertTriangle size={16} />
              {error}
              <button onClick={() => setError(null)} className="error-close">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Stats summary */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                <Calendar size={20} />
              </div>
              <span className="stat-value">{todayAppointments.length}</span>
              <span className="stat-label">Citas hoy</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                <Clock size={20} />
              </div>
              <span className="stat-value">{appointments.length}</span>
              <span className="stat-label">Próximas citas</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">
                <CheckCircle size={20} />
              </div>
              <span className="stat-value">
                {appointments.filter((a) => a.status === "CONFIRMED").length}
              </span>
              <span className="stat-label">Confirmadas</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-orange">
                <AlertTriangle size={20} />
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
                <ArrowRight size={14} />
                Próximas citas
              </button>
              <button
                className={`tab ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                <Clock size={14} />
                Historial
              </button>
            </div>

            <div className="tab-content">
              {loadingAppointments ? (
                <div className="loading-appointments">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Cargando citas...</span>
                </div>
              ) : appointments.length === 0 ? (
                <div className="empty-appointments">
                  <Calendar size={32} />
                  <h3>No hay citas programadas</h3>
                  <p>
                    Las citas de tus clientes aparecerán aquí cuando las
                    reserven.
                  </p>
                </div>
              ) : (
                <div className="appointments-grid">
                  {displayedAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onConfirm={() =>
                        openConfirmDialog(appointment.id, "CONFIRMED")
                      }
                      onComplete={() =>
                        openConfirmDialog(appointment.id, "COMPLETED")
                      }
                      onNoShow={() =>
                        openConfirmDialog(appointment.id, "NO_SHOW")
                      }
                      onCancel={() =>
                        openConfirmDialog(appointment.id, "CANCELLED")
                      }
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {confirmAction && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleUpdateStatus}
          title={confirmAction.title}
          message={confirmAction.message}
          loading={isUpdating}
          variant={confirmAction.variant}
        />
      )}
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
