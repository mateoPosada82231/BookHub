"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { notify } from "@/components/ui/toast";
import { Modal } from "@/components/ui";

interface WorkerFormData {
  email: string;
  full_name: string;
  position: string;
}

interface WorkerFormProps {
  businessId: number;
  onSave: () => void;
  onCancel: () => void;
}

export function WorkerForm({ businessId, onSave, onCancel }: WorkerFormProps) {
  const [formData, setFormData] = useState<WorkerFormData>({
    email: "",
    full_name: "",
    position: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.addWorker(businessId, formData);
      notify.success("Trabajador agregado correctamente");
      onSave();
    } catch (err: any) {
      const errorMessage = err.message || "Error al agregar trabajador";
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
      title="Agregar Trabajador"
      size="md"
    >
      <form
        onSubmit={handleSubmit}
        className="modal-form"
        style={{ padding: "0.5rem 2.25rem 2.25rem" }}
      >
        <div className="form-group">
          <label>Nombre completo</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            required
            placeholder="Juan Pérez"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            placeholder="juan@email.com"
          />
        </div>

        <div className="form-group">
          <label>Cargo / Posición</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            placeholder="Barbero Senior"
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Agregando..." : "Agregar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
