"use client";

import { memo, useCallback } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { EstablishmentCard } from "./EstablishmentCard";
import { FilterPanel, type FilterOptions } from "./FilterPanel";
import type { BusinessSummary } from "@/types";

interface EstablishmentGridProps {
  businesses: BusinessSummary[];
  favorites: Set<number> | number[];
  onToggleFavorite: (id: number) => void;
  onViewDetails: (id: number) => void;
  showFilterPanel?: boolean;
  onFilterToggle?: () => void;
  filters?: FilterOptions;
  onFilterApply?: (filters: FilterOptions) => void;
  onFilterClose?: () => void;
}

function EstablishmentGridComponent({
  businesses,
  favorites,
  onToggleFavorite,
  onViewDetails,
  showFilterPanel = false,
  onFilterToggle,
  filters,
  onFilterApply,
  onFilterClose,
}: EstablishmentGridProps) {
  const isFavorite = useCallback(
    (id: number) =>
      favorites instanceof Set ? favorites.has(id) : favorites.includes(id),
    [favorites],
  );

  const hasActiveFilters =
    filters && (filters.sortBy !== "rating" || filters.minRating > 0);

  return (
    <section className="establishments-section">
      <div className="establishments-container">
        {/* Results Header */}
        <div className="results-header">
          <p className="results-count">
            <span className="results-number">{businesses.length}</span> lugares
            encontrados
          </p>
          {onFilterToggle && (
            <div className="filter-controls-wrapper">
              <button
                onClick={onFilterToggle}
                className={`filter-button ${hasActiveFilters ? "filter-button-active" : ""}`}
                aria-label="Abrir filtros"
              >
                <SlidersHorizontal size={16} className="filter-icon" />
                <span>Filtros</span>
              </button>
              {filters && onFilterApply && onFilterClose && (
                <FilterPanel
                  isOpen={showFilterPanel}
                  onClose={onFilterClose}
                  filters={filters}
                  onApply={onFilterApply}
                />
              )}
            </div>
          )}
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
              <Search size={32} className="empty-icon" />
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
