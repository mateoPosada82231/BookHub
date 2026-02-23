// Auth API module

import { BaseApiClient, API_BASE_URL } from "./base";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: "OWNER" | "WORKER" | "CLIENT";
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
  full_name: string;
  email: string;
  role: "OWNER" | "WORKER" | "CLIENT";
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

class AuthApiClient extends BaseApiClient {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    // Refresh token is sent automatically via httpOnly cookie
    return this.request<AuthResponse>("/api/auth/refresh", {
      method: "POST",
    });
  }

  async logout(): Promise<void> {
    return this.request<void>("/api/auth/logout", {
      method: "POST",
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
    return this.request<MessageResponse>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async validateResetToken(token: string): Promise<MessageResponse> {
    return this.request<MessageResponse>(
      `/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
    );
  }

  async resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
    return this.request<MessageResponse>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const authApi = new AuthApiClient(API_BASE_URL);
