"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

const variantStyles = {
  danger: {
    iconBg: "bg-red-500/10 border border-red-500/20",
    iconColor: "text-red-400",
    button:
      "bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20",
  },
  warning: {
    iconBg: "bg-yellow-500/10 border border-yellow-500/20",
    iconColor: "text-yellow-400",
    button:
      "bg-gradient-to-b from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/20",
  },
  info: {
    iconBg: "bg-blue-500/10 border border-blue-500/20",
    iconColor: "text-blue-400",
    button:
      "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20",
  },
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
  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="p-8">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${styles.iconBg}`}
          >
            <AlertTriangle className={`w-7 h-7 ${styles.iconColor}`} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-neutral-400 mb-8 text-[0.95rem] leading-relaxed max-w-sm">
            {message}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-5 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 px-5 py-3 rounded-xl text-white font-medium transition-all duration-200 disabled:opacity-50 ${styles.button}`}
            >
              {loading ? "Procesando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
