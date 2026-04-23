"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { api, AuthResponse } from "@/lib/api";
import { UserRole } from "@/types";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
}

// Parse JWT token to get expiration time
function getTokenExpirationMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp) {
      const expiresAt = payload.exp * 1000; // Convert to ms
      return Math.max(expiresAt - Date.now(), 0);
    }
  } catch {
    // Invalid token
  }
  return null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isWorker: boolean;
  isClient: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithResponse: (response: AuthResponse) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tiempo antes de expiración para refrescar (5 minutos antes)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timeout de refresh
  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Programar refresh automático del token
  const scheduleTokenRefresh = useCallback(
    (expiresInMs: number) => {
      clearRefreshTimeout();

      // Programar refresh 5 minutos antes de que expire
      const refreshIn = Math.max(expiresInMs - REFRESH_THRESHOLD_MS, 0);

      if (refreshIn > 0) {
        refreshTimeoutRef.current = setTimeout(async () => {
          try {
            // Refresh token is sent automatically via httpOnly cookie
            const response = await api.refreshToken();
            saveAuthData(response);
          } catch {
            // Si falla el refresh, cerrar sesión
            clearAuthData();
          }
        }, refreshIn);
      }
    },
    [clearRefreshTimeout],
  );

  // Guardar datos de autenticación
  const saveAuthData = useCallback(
    (response: AuthResponse) => {
      localStorage.setItem("accessToken", response.access_token);
      document.cookie = `accessToken=${response.access_token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
      // refreshToken is stored as httpOnly cookie by the backend

      const userData: User = {
        id: response.user_id,
        email: response.email,
        fullName: response.full_name,
        role: response.role,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // Read actual token expiration, fallback to 1 hour if not parseable
      const expiresInMs =
        getTokenExpirationMs(response.access_token) ?? 60 * 60 * 1000;
      scheduleTokenRefresh(expiresInMs);
    },
    [scheduleTokenRefresh],
  );

  // Limpiar datos de autenticación
  const clearAuthData = useCallback(() => {
    clearRefreshTimeout();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    document.cookie = "accessToken=; path=/; max-age=0";
    setUser(null);
  }, [clearRefreshTimeout]);

  // Refrescar sesión manualmente (refresh token is sent via httpOnly cookie)
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.refreshToken();
      saveAuthData(response);
      return true;
    } catch {
      clearAuthData();
      return false;
    }
  }, [saveAuthData, clearAuthData]);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (accessToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

          // Read real token expiration for refresh scheduling
          const expiresInMs =
            getTokenExpirationMs(accessToken) ?? 30 * 60 * 1000;
          scheduleTokenRefresh(expiresInMs);
        } catch {
          // Datos inválidos, intentar refresh via httpOnly cookie
          const success = await refreshSession();
          if (!success) {
            clearAuthData();
          }
        }
      } else {
        // Intentar recuperar sesión con refresh token cookie
        const success = await refreshSession();
        if (!success) {
          clearAuthData();
        }
      }

      setIsLoading(false);
    };

    checkAuth();

    return () => {
      clearRefreshTimeout();
    };
  }, [
    refreshSession,
    clearAuthData,
    scheduleTokenRefresh,
    clearRefreshTimeout,
  ]);

  // Sincronizar logout/login entre pestañas del navegador
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        if (!e.newValue) {
          // Token eliminado en otra pestaña → logout local
          clearRefreshTimeout();
          setUser(null);
        } else if (!user && e.newValue) {
          // Token agregado en otra pestaña → recargar usuario
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
              scheduleTokenRefresh(
                getTokenExpirationMs(e.newValue) ?? 30 * 60 * 1000,
              );
            } catch {
              /* ignore */
            }
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user, clearRefreshTimeout, scheduleTokenRefresh]);

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userData: any = await api.getMe();
      const updatedUser: User = {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name ?? userData.fullName ?? "",
        role: userData.role,
        phone: userData.phone,
        avatarUrl: userData.avatar_url ?? userData.avatarUrl,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }, []);

  // Login
  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.login({ email, password });
      saveAuthData(response);
    },
    [saveAuthData],
  );

  // Login with already-received auth response (e.g. after registration)
  const loginWithResponse = useCallback(
    (response: AuthResponse) => {
      saveAuthData(response);
    },
    [saveAuthData],
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignorar errores de API, siempre limpiar localmente
    } finally {
      clearAuthData();
    }
  }, [clearAuthData]);

  // Computed values para roles
  const isOwner = user?.role === "OWNER";
  const isWorker = user?.role === "WORKER";
  const isClient = user?.role === "CLIENT";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isOwner,
        isWorker,
        isClient,
        login,
        loginWithResponse,
        logout,
        refreshSession,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
