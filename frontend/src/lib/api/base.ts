// Base API configuration and client

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface ApiError {
  message: string;
  status: number;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    // Refresh token is sent automatically via httpOnly cookie
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) return false;

    const data = await response.json();
    localStorage.setItem("accessToken", data.access_token);
    document.cookie = `accessToken=${data.access_token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    return true;
  } catch {
    return false;
  }
}

export class BaseApiClient {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    // Add auth token if available
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    let response = await fetch(url, config);

    // On 401, try to refresh the token and retry once
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !endpoint.includes("/api/auth/")
    ) {
      // Deduplicate concurrent refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = tryRefreshToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const refreshed = await (refreshPromise ?? Promise.resolve(false));

      if (refreshed) {
        // Retry with new token
        const newToken = localStorage.getItem("accessToken");
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(url, config);
      } else {
        // Refresh failed — clear auth and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tokenExpiry");
        document.cookie = "accessToken=; path=/; max-age=0";
        window.location.href = "/login";
        throw { message: "Sesión expirada", status: 401 } as ApiError;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || "Error en la solicitud",
        status: response.status,
      } as ApiError;
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }
}
