"use client";

import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
}

const variantConfig = {
  danger: { icon: XCircle, name: "danger" },
  warning: { icon: AlertTriangle, name: "warning" },
  info: { icon: Info, name: "info" },
  success: { icon: CheckCircle, name: "success" },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="confirm-dialog-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            onClick={(e) => e.stopPropagation()}
            className={`confirm-dialog-content confirm-dialog-variant-${config.name}`}
          >
            <div className="confirm-dialog-icon-wrapper">
              <Icon className="confirm-dialog-icon w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h3 className="confirm-dialog-title">{title}</h3>
            <p className="confirm-dialog-message">{message}</p>
            <div className="confirm-dialog-actions">
              <button
                onClick={onClose}
                disabled={loading}
                className="confirm-dialog-btn confirm-dialog-btn-cancel"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="confirm-dialog-btn confirm-dialog-btn-confirm"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? "Procesando..." : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
