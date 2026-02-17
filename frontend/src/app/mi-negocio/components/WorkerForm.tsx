"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { notify } from "@/components/ui/toast";

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
            Agregar Trabajador
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
      </motion.div>
    </motion.div>
  );
}
