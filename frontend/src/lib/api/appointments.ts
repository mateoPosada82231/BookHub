// Appointments API module

import { BaseApiClient, API_BASE_URL } from "./base";
import {
  Appointment,
  PageResponse,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AvailabilityResponse,
} from "@/types";

class AppointmentsApiClient extends BaseApiClient {
  async create(data: CreateAppointmentRequest): Promise<Appointment> {
    return this.request<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getById(id: number): Promise<Appointment> {
    return this.request<Appointment>(`/api/appointments/${id}`);
  }

  async getMy(page = 0, size = 10): Promise<PageResponse<Appointment>> {
    return this.request<PageResponse<Appointment>>(
      `/api/appointments/my?page=${page}&size=${size}`,
    );
  }

  async getMyUpcoming(): Promise<Appointment[]> {
    return this.request<Appointment[]>("/api/appointments/my/upcoming");
  }

  async getForWorker(
    workerId: number,
    page = 0,
    size = 10,
  ): Promise<PageResponse<Appointment>> {
    return this.request<PageResponse<Appointment>>(
      `/api/appointments/worker/${workerId}?page=${page}&size=${size}`,
    );
  }

  async getUpcomingForWorker(workerId: number): Promise<Appointment[]> {
    return this.request<Appointment[]>(
      `/api/appointments/worker/${workerId}/upcoming`,
    );
  }

  async update(
    id: number,
    data: UpdateAppointmentRequest,
  ): Promise<Appointment> {
    return this.request<Appointment>(`/api/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async cancel(id: number, reason?: string): Promise<Appointment> {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    return this.request<Appointment>(
      `/api/appointments/${id}/cancel${params}`,
      {
        method: "POST",
      },
    );
  }

  async reschedule(
    id: number,
    newStartTime: string,
    reason?: string,
  ): Promise<Appointment> {
    return this.request<Appointment>(`/api/appointments/${id}/reschedule`, {
      method: "POST",
      body: JSON.stringify({ new_start_time: newStartTime, reason }),
    });
  }

  async confirm(id: number): Promise<Appointment> {
    return this.request<Appointment>(`/api/appointments/${id}/confirm`, {
      method: "POST",
    });
  }

  async complete(id: number): Promise<Appointment> {
    return this.request<Appointment>(`/api/appointments/${id}/complete`, {
      method: "POST",
    });
  }

  async getWorkerAvailability(
    workerId: number,
    date: string,
    duration?: number,
  ): Promise<AvailabilityResponse> {
    const params = new URLSearchParams({ date });
    if (duration) params.append("duration", duration.toString());
    return this.request<AvailabilityResponse>(
      `/api/appointments/availability/${workerId}?${params.toString()}`,
    );
  }
}

export const appointmentsApi = new AppointmentsApiClient(API_BASE_URL);
