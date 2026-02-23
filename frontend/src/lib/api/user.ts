// User API module

import { BaseApiClient, API_BASE_URL } from "./base";
import {
  User,
  UserStats,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types";

class UserApiClient extends BaseApiClient {
  async getMe(): Promise<User> {
    return this.request<User>("/api/users/me", {
      method: "GET",
    });
  }

  async getMyStats(): Promise<UserStats> {
    return this.request<UserStats>("/api/users/me/stats", {
      method: "GET",
    });
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return this.request<User>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return this.request<void>("/api/users/me/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const userApi = new UserApiClient(API_BASE_URL);
