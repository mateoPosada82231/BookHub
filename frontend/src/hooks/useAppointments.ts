import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { notify } from "@/components/ui/toast";
import type { Appointment } from "@/types";

interface UseAppointmentsOptions {
  role?: "client" | "worker";
  workerId?: number;
  autoLoad?: boolean;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  cancelAppointment: (id: number, reason?: string) => Promise<void>;
  confirmAppointment: (id: number) => Promise<void>;
  completeAppointment: (id: number) => Promise<void>;
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  pendingCount: number;
}

function isUpcoming(dateString: string): boolean {
  return new Date(dateString) > new Date();
}

export function useAppointments(
  options: UseAppointmentsOptions = {},
): UseAppointmentsReturn {
  const { role = "client", workerId, autoLoad = true } = options;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    // Don't load worker appointments without a valid workerId
    if (role === "worker" && (!workerId || workerId <= 0)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response =
        role === "worker"
          ? await api.getWorkerAppointments(workerId!, 0, 50)
          : await api.getMyAppointments(0, 50);
      setAppointments(response.content || []);
    } catch (err: any) {
      const errorMessage = err.message || "Error al cargar las citas";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [role, workerId]);

  const cancelAppointment = useCallback(
    async (id: number, reason?: string) => {
      try {
        await api.cancelAppointment(id, reason);
        notify.success("Cita cancelada correctamente");
        await loadAppointments();
      } catch (err: any) {
        const errorMessage = err.message || "Error al cancelar la cita";
        notify.error(errorMessage);
        throw err;
      }
    },
    [loadAppointments],
  );

  const confirmAppointment = useCallback(
    async (id: number) => {
      try {
        await api.confirmAppointment(id);
        notify.success("Cita confirmada");
        await loadAppointments();
      } catch (err: any) {
        const errorMessage = err.message || "Error al confirmar la cita";
        notify.error(errorMessage);
        throw err;
      }
    },
    [loadAppointments],
  );

  const completeAppointment = useCallback(
    async (id: number) => {
      try {
        await api.completeAppointment(id);
        notify.success("Cita completada");
        await loadAppointments();
      } catch (err: any) {
        const errorMessage = err.message || "Error al completar la cita";
        notify.error(errorMessage);
        throw err;
      }
    },
    [loadAppointments],
  );

  // Computed values
  const upcomingAppointments = appointments.filter(
    (apt) =>
      isUpcoming(apt.start_time) &&
      apt.status !== "CANCELLED" &&
      apt.status !== "COMPLETED",
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      !isUpcoming(apt.start_time) ||
      apt.status === "CANCELLED" ||
      apt.status === "COMPLETED",
  );

  const pendingCount = appointments.filter(
    (apt) => apt.status === "PENDING",
  ).length;

  // Auto load on mount
  useEffect(() => {
    if (autoLoad) {
      loadAppointments();
    }
  }, [autoLoad, loadAppointments]);

  return {
    appointments,
    loading,
    error,
    reload: loadAppointments,
    cancelAppointment,
    confirmAppointment,
    completeAppointment,
    upcomingAppointments,
    pastAppointments,
    pendingCount,
  };
}
