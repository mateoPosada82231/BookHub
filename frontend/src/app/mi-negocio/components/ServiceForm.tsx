"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { notify } from "@/components/ui/toast";
import { Modal } from "@/components/ui";
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

    // Validations
    if (formData.name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      setLoading(false);
      return;
    }
    if (formData.duration_minutes < 5 || formData.duration_minutes > 480) {
      setError("La duración debe estar entre 5 y 480 minutos");
      setLoading(false);
      return;
    }
    if (formData.price < 0) {
      setError("El precio no puede ser negativo");
      setLoading(false);
      return;
    }

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
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={service ? "Editar Servicio" : "Nuevo Servicio"}
      size="md"
    >
      <form
        onSubmit={handleSubmit}
        className="modal-form"
        style={{ padding: "0.5rem 2.25rem 2.25rem" }}
      >
        <div className="form-group">
          <label>Nombre del servicio</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
    </Modal>
  );
}
