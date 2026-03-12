"use client";

import { useState } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { Modal } from "@/components/ui";
import { CreateReviewRequest } from "@/types";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReviewRequest) => Promise<void>;
  appointmentInfo?: {
    serviceName: string;
    businessName: string;
    workerName: string;
    date: string;
  };
}

export function ReviewForm({
  isOpen,
  onClose,
  onSubmit,
  appointmentInfo,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Por favor selecciona una calificación");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ rating, comment: comment.trim() || undefined });
      // Reset form
      setRating(0);
      setComment("");
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al enviar la reseña";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1:
        return "Muy malo";
      case 2:
        return "Malo";
      case 3:
        return "Regular";
      case 4:
        return "Bueno";
      case 5:
        return "Excelente";
      default:
        return "Selecciona una calificación";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deja tu reseña" size="md">
      <div style={{ padding: "0 1.75rem 1.75rem" }}>
        <div
          className="review-modal-header"
          style={{ borderTop: "none", paddingTop: 0 }}
        >
          <div className="review-modal-icon">
            <MessageSquare size={24} />
          </div>
          {appointmentInfo && (
            <p className="review-appointment-info">
              {appointmentInfo.serviceName} en {appointmentInfo.businessName}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          {/* Star Rating */}
          <div className="review-rating-section">
            <label>¿Cómo fue tu experiencia?</label>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`review-star ${star <= displayRating ? "active" : ""}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    size={32}
                    fill={star <= displayRating ? "#facc15" : "transparent"}
                    stroke={star <= displayRating ? "#facc15" : "#525252"}
                  />
                </button>
              ))}
            </div>
            <span className="review-rating-label">
              {getRatingLabel(displayRating)}
            </span>
          </div>

          {/* Comment */}
          <div className="review-comment-section">
            <label htmlFor="review-comment">
              Comparte tu experiencia (opcional)
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos qué te pareció el servicio, la atención, el ambiente..."
              rows={4}
              maxLength={1000}
            />
            <span className="review-char-count">{comment.length}/1000</span>
          </div>

          {/* Error */}
          {error && <div className="review-error">{error}</div>}

          {/* Actions */}
          <div className="review-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Enviando...
                </>
              ) : (
                "Enviar reseña"
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
