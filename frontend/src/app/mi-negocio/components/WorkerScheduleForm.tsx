"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { notify } from "@/components/ui/toast";
import { Modal } from "@/components/ui";
import type { Worker } from "@/types";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

interface ScheduleItem {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface WorkerScheduleFormProps {
  businessId: number;
  worker: Worker;
  onSave: () => void;
  onCancel: () => void;
}

export function WorkerScheduleForm({
  businessId,
  worker,
  onSave,
  onCancel,
}: WorkerScheduleFormProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    // Initialize with existing schedules or default empty schedule
    if (worker.schedules && worker.schedules.length > 0) {
      return worker.schedules.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_available: s.is_available,
      }));
    }
    // Default: all days with 9am-6pm schedule
    return DAY_NAMES.map((_, index) => ({
      day_of_week: index,
      start_time: "09:00",
      end_time: "18:00",
      is_available: index > 0 && index < 6, // Monday-Friday available by default
    }));
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleDay = (dayIndex: number) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayIndex
          ? { ...s, is_available: !s.is_available }
          : s,
      ),
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: "start_time" | "end_time",
    value: string,
  ) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayIndex ? { ...s, [field]: value } : s,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that start_time < end_time for available days
    const invalidDays = schedules
      .filter((s) => s.is_available && s.start_time >= s.end_time)
      .map((s) => DAY_NAMES[s.day_of_week]);

    if (invalidDays.length > 0) {
      setError(
        `La hora de inicio debe ser anterior a la hora de fin en: ${invalidDays.join(", ")}`,
      );
      setLoading(false);
      return;
    }

    try {
      // Only send available schedules
      const availableSchedules = schedules.filter((s) => s.is_available);
      await api.setWorkerSchedule(businessId, worker.id, availableSchedules);
      notify.success("Horario guardado correctamente");
      onSave();
    } catch (err: any) {
      const errorMessage = err.message || "Error al guardar el horario";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={`Horario de ${worker.full_name}`}
      size="lg"
    >
      <form
        onSubmit={handleSubmit}
        className="modal-form"
        style={{ padding: "0.5rem 2.25rem 2.25rem" }}
      >
        <p className="schedule-instructions">
          Configura los días y horas de trabajo para este profesional.
        </p>

        <div className="schedule-grid">
          {schedules.map((schedule) => (
            <div
              key={schedule.day_of_week}
              className={`schedule-day ${schedule.is_available ? "active" : ""}`}
            >
              <div className="schedule-day-header">
                <label className="schedule-toggle">
                  <input
                    type="checkbox"
                    checked={schedule.is_available}
                    onChange={() => handleToggleDay(schedule.day_of_week)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="day-name">
                  {DAY_NAMES[schedule.day_of_week]}
                </span>
              </div>

              {schedule.is_available && (
                <div className="schedule-times">
                  <div className="time-input">
                    <label>Inicio</label>
                    <input
                      type="time"
                      value={schedule.start_time}
                      onChange={(e) =>
                        handleTimeChange(
                          schedule.day_of_week,
                          "start_time",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <span className="time-separator">-</span>
                  <div className="time-input">
                    <label>Fin</label>
                    <input
                      type="time"
                      value={schedule.end_time}
                      onChange={(e) =>
                        handleTimeChange(
                          schedule.day_of_week,
                          "end_time",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando..." : "Guardar horario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
