"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Camera,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  Save,
  X,
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  Crown,
  Briefcase,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import "@/styles/perfil.css";

function PerfilContent() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    appointments: 0,
    favorites: 0,
    reviews: 0,
  });

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.fullName || "",
        phone: user.phone || "",
        avatar_url: user.avatarUrl || "",
      });
      // Load user stats
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const appointments = await api.getMyAppointments(0, 1);
      setStats((prev) => ({
        ...prev,
        appointments: appointments.total_elements,
      }));
    } catch (err) {
      // Ignore errors for stats
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.updateProfile(formData);
      setSuccess("¡Perfil actualizado correctamente!");
      setIsEditing(false);
      if (refreshUser) {
        await refreshUser();
      }
      // Auto-hide success message
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Error al actualizar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        full_name: user.fullName || "",
        phone: user.phone || "",
        avatar_url: user.avatarUrl || "",
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLogoutLoading(false);
      setShowLogoutConfirm(false);
    }
  };

  if (!user) {
    return null;
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "OWNER":
        return { label: "Propietario", icon: Crown };
      case "WORKER":
        return { label: "Trabajador", icon: Briefcase };
      case "CLIENT":
        return { label: "Cliente", icon: User };
      default:
        return { label: role, icon: User };
    }
  };

  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="profile-page">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="profile-container">
          {/* Messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="profile-message profile-message-success"
              >
                <CheckCircle className="h-5 w-5" />
                <span>{success}</span>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="profile-message profile-message-error"
              >
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-header-card"
          >
            <div className="profile-header-content">
              {/* Avatar */}
              <div className="profile-avatar-container">
                <div className="profile-avatar">
                  {formData.avatar_url || user.avatarUrl ? (
                    <Image
                      src={formData.avatar_url || user.avatarUrl || ""}
                      alt={user.fullName}
                      width={96}
                      height={96}
                      className="profile-avatar-img"
                      style={{ objectFit: "cover", borderRadius: "50%" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <User className="profile-avatar-placeholder" />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="profile-info">
                <h1 className="profile-name">{user.fullName || "Usuario"}</h1>
                <p className="profile-email">{user.email}</p>
                <div className="profile-role-badge">
                  <RoleIcon />
                  <span>{roleInfo.label}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="profile-actions">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-edit-profile"
                  >
                    <Camera className="h-4 w-4" />
                    Editar perfil
                  </button>
                ) : (
                  <>
                    <button onClick={handleCancel} className="btn-cancel-edit">
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="btn-save-profile"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Guardando..." : "Guardar"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Edit Form */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="profile-edit-card"
              >
                <h2 className="profile-edit-title">
                  <User className="h-5 w-5" />
                  Información personal
                </h2>
                <div className="profile-form-grid">
                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      Nombre completo
                    </label>
                    <div className="profile-input-wrapper">
                      <User className="profile-input-icon h-5 w-5" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                        className="profile-input"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      Correo electrónico
                    </label>
                    <div className="profile-input-wrapper">
                      <Mail className="profile-input-icon h-5 w-5" />
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="profile-input"
                      />
                    </div>
                    <p className="profile-input-hint">
                      El correo electrónico no se puede cambiar
                    </p>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Teléfono</label>
                    <div className="profile-input-wrapper">
                      <Phone className="profile-input-icon h-5 w-5" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="profile-input"
                        placeholder="Tu número de teléfono"
                      />
                    </div>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      URL de foto de perfil
                    </label>
                    <div className="profile-input-wrapper">
                      <Camera className="profile-input-icon h-5 w-5" />
                      <input
                        type="url"
                        value={formData.avatar_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            avatar_url: e.target.value,
                          })
                        }
                        className="profile-input"
                        placeholder="https://ejemplo.com/tu-foto.jpg"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="profile-stats"
          >
            <div className="profile-stat-card">
              <div className="profile-stat-value">{stats.appointments}</div>
              <div className="profile-stat-label">Citas totales</div>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-value">{stats.favorites}</div>
              <div className="profile-stat-label">Favoritos</div>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-value">{stats.reviews}</div>
              <div className="profile-stat-label">Reseñas</div>
            </div>
          </motion.div>

          {/* Menu Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="profile-menu"
          >
            <button
              onClick={() => router.push("/mis-citas")}
              className="profile-menu-item"
            >
              <div className="profile-menu-icon">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="profile-menu-content">
                <div className="profile-menu-title">Mis Citas</div>
                <div className="profile-menu-description">
                  Ver historial y próximas citas
                </div>
              </div>
              <ChevronRight className="profile-menu-arrow h-5 w-5" />
            </button>

            <button className="profile-menu-item">
              <div className="profile-menu-icon">
                <Bell className="h-5 w-5" />
              </div>
              <div className="profile-menu-content">
                <div className="profile-menu-title">Notificaciones</div>
                <div className="profile-menu-description">
                  Configura tus alertas y recordatorios
                </div>
              </div>
              <ChevronRight className="profile-menu-arrow h-5 w-5" />
            </button>

            <button className="profile-menu-item">
              <div className="profile-menu-icon">
                <Shield className="h-5 w-5" />
              </div>
              <div className="profile-menu-content">
                <div className="profile-menu-title">Privacidad y seguridad</div>
                <div className="profile-menu-description">
                  Contraseña, verificación en dos pasos
                </div>
              </div>
              <ChevronRight className="profile-menu-arrow h-5 w-5" />
            </button>
          </motion.div>

          {/* Logout */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleLogout}
            className="profile-logout"
          >
            <div className="profile-logout-icon">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="profile-logout-text">Cerrar sesión</span>
          </motion.button>
        </div>
      </main>

      {/* Modal de confirmación para logout */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        variant="warning"
        loading={logoutLoading}
      />
    </div>
  );
}

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <PerfilContent />
    </ProtectedRoute>
  );
}
