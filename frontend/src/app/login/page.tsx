"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PublicOnlyRoute } from "@/components/ProtectedRoute";
import { ApiError } from "@/lib/api";
import { notify } from "@/components/ui/toast";
import "@/styles/auth.css";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(formData.email, formData.password);
      notify.success("¡Bienvenido de nuevo!");
      router.push(returnTo);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.message ||
        "Error al iniciar sesión. Verifica tus credenciales.";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="login-container">
        <div className="logo">
          <h1>BOOKHUB</h1>
        </div>
        <h2 className="login-title">Iniciar Sesión</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Correo electrónico
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ingresa tu correo electrónico"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="text-end mt-1">
              <Link
                href="/recuperar-password"
                className="small text-primary text-decoration-none"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          <Link href="/registro" className="login-link">
            ¿No tienes una cuenta? Regístrate
          </Link>
        </div>

        <div className="login-footer">
          <p>Reserva en tus lugares favoritos</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PublicOnlyRoute>
      <Suspense fallback={null}>
        <LoginPageContent />
      </Suspense>
    </PublicOnlyRoute>
  );
}
