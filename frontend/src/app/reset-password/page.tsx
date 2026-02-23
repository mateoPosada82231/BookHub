"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PublicOnlyRoute } from "@/components/ProtectedRoute";
import { notify } from "@/components/ui/toast";
import "@/styles/auth.css";
import { API_BASE_URL } from "@/lib/api/base";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token de recuperación no proporcionado");
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
        );

        if (response.ok) {
          setIsTokenValid(true);
        } else {
          setError("El enlace de recuperación es inválido o ha expirado");
        }
      } catch {
        setError("Error al validar el enlace de recuperación");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      notify.error("Las contraseñas no coinciden");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      notify.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      if (response.ok) {
        const successMessage = "¡Contraseña actualizada correctamente!";
        setSuccess(successMessage + " Redirigiendo al inicio de sesión...");
        notify.success(successMessage);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || "Error al actualizar la contraseña";
        setError(errorMessage);
        notify.error(errorMessage);
      }
    } catch {
      const errorMessage = "Error de conexión. Por favor, intenta de nuevo.";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#050d0c] flex items-center justify-center px-4">
        <div className="recover-password-container">
          <div className="logo">
            <h1>BOOKHUB</h1>
          </div>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Validando...</span>
            </div>
            <p className="mt-3 text-neutral-400">
              Validando enlace de recuperación...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-[#050d0c] flex items-center justify-center px-4">
        <div className="recover-password-container">
          <div className="logo">
            <h1>BOOKHUB</h1>
          </div>
          <h2 className="recover-password-title">Enlace Inválido</h2>

          <div className="alert alert-danger text-center mb-4">
            {error || "El enlace de recuperación es inválido o ha expirado"}
          </div>

          <p className="text-center text-neutral-400 mb-4">
            Por favor, solicita un nuevo enlace de recuperación.
          </p>

          <div className="d-grid gap-2">
            <Link href="/recuperar-password" className="btn btn-primary">
              Solicitar nuevo enlace
            </Link>
          </div>

          <div className="text-center mt-3">
            <Link href="/login" className="recover-password-link">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="recover-password-container">
        <div className="logo">
          <h1>BOOKHUB</h1>
        </div>
        <h2 className="recover-password-title">Nueva Contraseña</h2>

        <div className="alert alert-info text-center mb-4">
          Ingresa tu nueva contraseña
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar contraseña
            </label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Repite la contraseña"
            />
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !!success}
            >
              {isLoading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          <Link href="/login" className="recover-password-link">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050d0c] flex items-center justify-center">
          <div className="text-white">Cargando...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

export default function ResetPasswordPage() {
  return (
    <PublicOnlyRoute>
      <ResetPasswordContent />
    </PublicOnlyRoute>
  );
}
