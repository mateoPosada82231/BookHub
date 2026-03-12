"use client";

import { memo, useCallback, useRef, useEffect } from "react";
import { Star, X } from "lucide-react";

export interface FilterOptions {
  sortBy: string;
  minRating: number;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
}

const SORT_OPTIONS = [
  { value: "rating", label: "Mejor valorados" },
  { value: "name", label: "Nombre A-Z" },
  { value: "newest", label: "Más recientes" },
];

const RATING_OPTIONS = [0, 3, 3.5, 4, 4.5];

function FilterPanelComponent({
  isOpen,
  onClose,
  filters,
  onApply,
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleSortChange = useCallback(
    (sortBy: string) => {
      onApply({ ...filters, sortBy });
    },
    [filters, onApply],
  );

  const handleRatingChange = useCallback(
    (minRating: number) => {
      onApply({ ...filters, minRating });
    },
    [filters, onApply],
  );

  const handleReset = useCallback(() => {
    onApply({ sortBy: "rating", minRating: 0 });
  }, [onApply]);

  if (!isOpen) return null;

  const hasActiveFilters = filters.sortBy !== "rating" || filters.minRating > 0;

  return (
    <div className="filter-panel" ref={panelRef}>
      <div className="filter-panel-header">
        <h3 className="filter-panel-title">Filtros</h3>
        <button
          onClick={onClose}
          className="filter-panel-close"
          aria-label="Cerrar filtros"
        >
          <X size={18} />
        </button>
      </div>

      {/* Ordenar por */}
      <div className="filter-section">
        <h4 className="filter-section-title">Ordenar por</h4>
        <div className="filter-sort-options">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={`filter-sort-btn ${
                filters.sortBy === opt.value ? "filter-sort-btn-active" : ""
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating mínimo */}
      <div className="filter-section">
        <h4 className="filter-section-title">Rating mínimo</h4>
        <div className="filter-rating-options">
          {RATING_OPTIONS.map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={`filter-rating-btn ${
                filters.minRating === rating ? "filter-rating-btn-active" : ""
              }`}
            >
              {rating === 0 ? (
                "Todos"
              ) : (
                <>
                  <Star
                    size={14}
                    className="filter-star-icon"
                    fill="currentColor"
                  />
                  <span>{rating}+</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button onClick={handleReset} className="filter-reset-btn">
          Restablecer filtros
        </button>
      )}
    </div>
  );
}

export const FilterPanel = memo(FilterPanelComponent);
