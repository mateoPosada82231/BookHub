import { BaseApiClient, API_BASE_URL } from "./base";
import type { Notification } from "@/types";

export interface NotificationsPageResponse {
  content: Notification[];
  total_elements: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

class NotificationsApiClient extends BaseApiClient {
  async getMy(page = 0, size = 20): Promise<NotificationsPageResponse> {
    return this.request<NotificationsPageResponse>(
      `/api/notifications?page=${page}&size=${size}`,
    );
  }

  async getUnreadCount(): Promise<{ unread_count: number }> {
    return this.request<{ unread_count: number }>(
      "/api/notifications/unread-count",
    );
  }

  async markAsRead(id: number): Promise<Notification> {
    return this.request<Notification>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
  }

  async markAllAsRead(): Promise<{ updated_count: number }> {
    return this.request<{ updated_count: number }>(
      "/api/notifications/read-all",
      {
        method: "PATCH",
      },
    );
  }

  streamUrl(): string {
    return `${API_BASE_URL}/api/notifications/stream`;
  }
}

export const notificationsApi = new NotificationsApiClient(API_BASE_URL);
