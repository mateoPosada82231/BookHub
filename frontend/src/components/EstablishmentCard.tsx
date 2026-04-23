"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import { Star, Heart, MapPin, Scissors } from "lucide-react";
import type { BusinessSummary } from "@/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Imagen por defecto si no hay cover image
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop";

interface EstablishmentCardProps {
  business: BusinessSummary;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onViewDetails: (id: number) => void;
}

function EstablishmentCardComponent({
  business,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
}: EstablishmentCardProps) {
  const [showRemoveFavoriteConfirm, setShowRemoveFavoriteConfirm] =
    useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isFavorite) {
        // Si ya es favorito, mostrar confirmación para remover
        setShowRemoveFavoriteConfirm(true);
      } else {
        // Si no es favorito, añadir directamente
        onToggleFavorite(business.id);
      }
    },
    [business.id, isFavorite, onToggleFavorite],
  );

  const handleConfirmRemoveFavorite = async () => {
    setFavoriteLoading(true);
    try {
      onToggleFavorite(business.id);
    } catch (error) {
      console.error("Error al remover favorito:", error);
    } finally {
      setFavoriteLoading(false);
      setShowRemoveFavoriteConfirm(false);
    }
  };

  const handleViewDetails = useCallback(() => {
    onViewDetails(business.id);
  }, [business.id, onViewDetails]);

  const rating = business.average_rating ?? 0;
  const imageUrl = business.cover_image_url || DEFAULT_IMAGE;

  return (
    <article className="establishment-card">
      {/* Image Container */}
      <div className="establishment-image-container">
        <Image
          src={imageUrl}
          alt={business.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="establishment-image"
          loading="lazy"
        />
        <div className="establishment-image-overlay" />

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="favorite-button"
          aria-label={
            isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
          }
        >
          <Heart
            size={18}
            className={`favorite-icon ${isFavorite ? "favorite-icon-active" : ""}`}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>

        {/* Category Badge */}
        <div className="status-badge-container">
          <span className="status-badge status-badge-category">
            {business.category_display}
          </span>
        </div>

        {/* Services Count Badge */}
        <div className="price-badge-container">
          <span className="price-badge">
            <Scissors size={14} className="inline-block align-middle mr-1" />
            {business.services_count} servicios
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="establishment-content">
        <div className="establishment-header">
          <h3 className="establishment-name">{business.name}</h3>
          <div className="establishment-rating">
            <Star size={14} className="rating-star" fill="currentColor" />
            <span className="rating-value">{rating.toFixed(1)}</span>
            <span className="rating-count">({business.total_reviews})</span>
          </div>
        </div>

        <div className="establishment-location">
          <MapPin size={14} className="location-icon" />
          <span>{business.address}</span>
          {business.city && (
            <>
              <span className="location-separator">•</span>
              <span>{business.city}</span>
            </>
          )}
        </div>

        <button
          onClick={handleViewDetails}
          className="establishment-button"
          aria-label={`Ver disponibilidad de ${business.name}`}
        >
          Ver disponibilidad
        </button>
      </div>

      {/* Modal de confirmación para remover favorito */}
      <ConfirmDialog
        isOpen={showRemoveFavoriteConfirm}
        onClose={() => setShowRemoveFavoriteConfirm(false)}
        onConfirm={handleConfirmRemoveFavorite}
        title="Remover de Favoritos"
        message={`¿Estás seguro de que quieres remover ${business.name} de tus favoritos?`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="warning"
        loading={favoriteLoading}
      />
    </article>
  );
}

export const EstablishmentCard = memo(EstablishmentCardComponent);
