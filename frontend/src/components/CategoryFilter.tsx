"use client";

import { memo, useCallback } from "react";
import {
  Search,
  Scissors,
  Sparkles,
  PawPrint,
  Car,
  Paintbrush,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryOption } from "@/types";

// Iconos para cada categoría del backend
const categoryIcons: Record<string, LucideIcon> = {
  BARBERSHOP: Scissors,
  HAIR_SALON: Scissors,
  NAIL_SALON: Paintbrush,
  SPA: Sparkles,
  CAR_WASH: Car,
  PET_GROOMING: PawPrint,
  TATTOO_STUDIO: Paintbrush,
  OTHER: Store,
};

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: CategoryOption[];
}

function CategoryFilterComponent({
  selectedCategory,
  onCategoryChange,
  categories,
}: CategoryFilterProps) {
  const handleClick = useCallback(
    (categoryId: string) => {
      onCategoryChange(categoryId);
    },
    [onCategoryChange],
  );

  return (
    <div className="category-filter">
      {/* Botón "Todos" */}
      <button
        onClick={() => handleClick("all")}
        className={`category-button ${
          selectedCategory === "all" ? "category-button-active" : ""
        }`}
        aria-pressed={selectedCategory === "all"}
        aria-label="Mostrar todos"
      >
        <Search size={16} className="category-icon" />
        <span>Todos</span>
      </button>

      {/* Categorías del backend */}
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleClick(cat.value)}
          className={`category-button ${
            selectedCategory === cat.value ? "category-button-active" : ""
          }`}
          aria-pressed={selectedCategory === cat.value}
          aria-label={`Filtrar por ${cat.label}`}
        >
          {(() => {
            const IconComponent = categoryIcons[cat.value] || Store;
            return <IconComponent size={16} className="category-icon" />;
          })()}
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}

export const CategoryFilter = memo(CategoryFilterComponent);
