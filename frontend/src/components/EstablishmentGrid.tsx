"use client";

import { memo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faSearch } from "@fortawesome/free-solid-svg-icons";
import { EstablishmentCard } from "./EstablishmentCard";
import type { BusinessSummary } from "@/types";

interface EstablishmentGridProps {
  businesses: BusinessSummary[];
  favorites: Set<number> | number[];
  onToggleFavorite: (id: number) => void;
  onViewDetails: (id: number) => void;
}

function EstablishmentGridComponent({
  businesses,
  favorites,
  onToggleFavorite,
  onViewDetails,
}: EstablishmentGridProps) {
  const isFavorite = useCallback(
    (id: number) =>
      favorites instanceof Set ? favorites.has(id) : favorites.includes(id),
    [favorites],
  );

  return (
    <section className="establishments-section">
      <div className="establishments-container">
        {/* Results Header */}
        <div className="results-header">
          <p className="results-count">
            <span className="results-number">{businesses.length}</span> lugares
            encontrados
          </p>
        </div>

        {/* Grid */}
        {businesses.length > 0 ? (
          <div className="establishments-grid">
            {businesses.map((business, index) => (
              <div
                key={business.id}
                className="animate-fadeInUp"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <EstablishmentCard
                  business={business}
                  isFavorite={isFavorite(business.id)}
                  onToggleFavorite={onToggleFavorite}
                  onViewDetails={onViewDetails}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-container">
              <FontAwesomeIcon icon={faSearch} className="empty-icon" />
            </div>
            <h3 className="empty-title">No encontramos resultados</h3>
            <p className="empty-description">
              Intenta con otra búsqueda o cambia los filtros
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export const EstablishmentGrid = memo(EstablishmentGridComponent);
