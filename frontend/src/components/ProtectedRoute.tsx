"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles permitidos para acceder a esta ruta. Si no se especifica, cualquier usuario autenticado puede acceder */
  allowedRoles?: UserRole[];
  /** Ruta a la que redirigir si no tiene permisos (default: "/") */
  fallbackPath?: string;
}

/**
 * Componente que protege rutas requiriendo autenticación y opcionalmente roles específicos.
 * Redirige a /login si no está autenticado o a fallbackPath si no tiene el rol requerido.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = "/",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // No autenticado -> ir a login con returnTo
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Autenticado pero sin el rol requerido -> ir a fallback
        router.push(fallbackPath);
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router, fallbackPath]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingScreen />;
  }

  // No mostrar contenido si no está autenticado
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  // No mostrar contenido si no tiene el rol requerido
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

/**
 * Componente para rutas públicas que no deben ser accesibles si el usuario ya está autenticado.
 * Por ejemplo: login, registro.
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

/**
 * Componente de pantalla de carga reutilizable
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <span className="text-neutral-400 text-sm">Cargando...</span>
      </div>
    </div>
  );
}
