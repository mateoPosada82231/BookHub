"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { notify } from "@/components/ui/toast";
import type { Business, CreateBusinessRequest } from "@/types";

interface BusinessFormData {
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  cover_image_url: string;
}

interface BusinessFormProps {
  business?: Business | null;
  onSave: () => void;
  onCancel: () => void;
}

export function BusinessForm({
  business,
  onSave,
  onCancel,
}: BusinessFormProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: business?.name || "",
    category: business?.category || "BARBERSHOP",
    description: business?.description || "",
    address: business?.address || "",
    city: business?.city || "",
    phone: business?.phone || "",
    cover_image_url: business?.cover_image_url || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validations
    if (formData.name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      setLoading(false);
      return;
    }
    if (!formData.address.trim()) {
      setError("La dirección es requerida");
      setLoading(false);
      return;
    }
    if (!formData.city.trim()) {
      setError("La ciudad es requerida");
      setLoading(false);
      return;
    }
    if (
      formData.cover_image_url &&
      !formData.cover_image_url.startsWith("http")
    ) {
      setError("La URL de imagen debe comenzar con http:// o https://");
      setLoading(false);
      return;
    }

    try {
      if (business) {
        await api.updateBusiness(business.id, formData);
        notify.success("Negocio actualizado correctamente");
      } else {
        await api.createBusiness(formData as CreateBusinessRequest);
        notify.success("¡Negocio creado exitosamente!");
      }
      onSave();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al guardar el negocio";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="modal-overlay"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.75rem",
          }}
        >
          <h2 className="modal-title" style={{ marginBottom: 0 }}>
            {business ? "Editar Negocio" : "Nuevo Negocio"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "0.5rem",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#666",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
            }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Nombre del negocio</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Mi Barbería"
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option value="BARBERSHOP">Barbería</option>
              <option value="HAIR_SALON">Salón de Belleza</option>
              <option value="NAIL_SALON">Manicura/Pedicura</option>
              <option value="SPA">Spa</option>
              <option value="CAR_WASH">Autolavado</option>
              <option value="PET_GROOMING">Peluquería de Mascotas</option>
              <option value="TATTOO_STUDIO">Estudio de Tatuajes</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe tu negocio..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
                placeholder="Calle 123 #45-67"
              />
            </div>
            <div className="form-group">
              <label>Ciudad</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
                placeholder="Medellín"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="300 123 4567"
            />
          </div>

          <div className="form-group">
            <label>URL de imagen de portada</label>
            <input
              type="url"
              value={formData.cover_image_url}
              onChange={(e) =>
                setFormData({ ...formData, cover_image_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
