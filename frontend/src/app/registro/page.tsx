"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { PublicOnlyRoute } from "@/components/ProtectedRoute";
import "@/styles/auth.css";

type RegisterRole = "CLIENT" | "OWNER";

function RegisterPageContent() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "CLIENT" as RegisterRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
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
    setSuccess("");

    // Validar longitud mínima de contraseña
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    // Validar formato de teléfono (al menos 7 dígitos)
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 7) {
      setError("Ingresa un número de teléfono válido (mínimo 7 dígitos)");
      setIsLoading(false);
      return;
    }

    const registerData = {
      email: formData.email,
      password: formData.password,
      fullName: `${formData.firstName} ${formData.lastName}`,
      phone: formData.phone,
      role: formData.role,
    };

    try {
      await api.register(registerData);
      setSuccess(
        "¡Registro exitoso! Serás redirigido a la página de inicio de sesión.",
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Error al registrar usuario");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="register-container">
        <div className="logo">
          <h1>BOOKHUB</h1>
        </div>
        <h2 className="register-title">Registro</h2>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Selección de tipo de cuenta */}
          <div className="mb-4">
            <label htmlFor="role" className="form-label">
              Tipo de cuenta
            </label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-option ${formData.role === "CLIENT" ? "role-option-active" : ""}`}
                onClick={() => setFormData({ ...formData, role: "CLIENT" })}
              >
                <span className="role-option-title">Cliente</span>
                <span className="role-option-desc">Quiero reservar citas</span>
              </button>
              <button
                type="button"
                className={`role-option ${formData.role === "OWNER" ? "role-option-active" : ""}`}
                onClick={() => setFormData({ ...formData, role: "OWNER" })}
              >
                <span className="role-option-title">Dueño de Negocio</span>
                <span className="role-option-desc">
                  Quiero gestionar mi negocio
                </span>
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="firstName" className="form-label">
              Nombre
            </label>
            <input
              type="text"
              className="form-control"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="Ingresa tu nombre"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="lastName" className="form-label">
              Apellido
            </label>
            <input
              type="text"
              className="form-control"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Ingresa tu apellido"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="phone" className="form-label">
              Teléfono
            </label>
            <input
              type="text"
              className="form-control"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Ingresa tu teléfono"
            />
          </div>

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
              required
              placeholder="Ingresa tu correo electrónico"
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
                required
                placeholder="Ingresa tu contraseña"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Contraseña
            </label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirma tu contraseña"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
              className="btn btn-primary register-btn"
              disabled={isLoading}
            >
              {isLoading ? "Procesando..." : "Registrarse"}
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          <Link href="/login" className="register-link">
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <PublicOnlyRoute>
      <RegisterPageContent />
    </PublicOnlyRoute>
  );
}
