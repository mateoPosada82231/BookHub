"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { notify } from "@/components/ui/toast";
import type { Service } from "@/types";

interface ServiceFormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

interface ServiceFormProps {
  businessId: number;
  service?: Service | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ServiceForm({
  businessId,
  service,
  onSave,
  onCancel,
}: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: service?.name || "",
    description: service?.description || "",
    duration_minutes: service?.duration_minutes || 30,
    price: service?.price || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (service) {
        await api.updateService(businessId, service.id, formData);
        notify.success("Servicio actualizado correctamente");
      } else {
        await api.createService(businessId, formData);
        notify.success("Servicio creado exitosamente");
      }
      onSave();
    } catch (err: any) {
      const errorMessage = err.message || "Error al guardar el servicio";
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
            {service ? "Editar Servicio" : "Nuevo Servicio"}
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
            <label>Nombre del servicio</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Corte de cabello"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe el servicio..."
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duración (minutos)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value) || 0,
                  })
                }
                required
                min={5}
                step={5}
              />
            </div>
            <div className="form-group">
              <label>Precio ($)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                required
                min={0}
                step={1000}
              />
            </div>
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
