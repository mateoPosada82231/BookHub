"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EstablishmentGrid } from "@/components/EstablishmentGrid";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type {
  BusinessSummary,
  BusinessCategory,
  CategoryOption,
} from "@/types";
import type { FilterOptions } from "@/components/FilterPanel";
import "@/styles/home.css";

function HomePageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Estados
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Estados de datos
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filtros avanzados
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "rating",
    minRating: 0,
  });

  // Cargar categorías y favoritos al montar
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [cats, favIds] = await Promise.all([
          api.getCategories(),
          isAuthenticated
            ? api.getMyFavoriteIds().catch(() => [] as number[])
            : Promise.resolve([] as number[]),
        ]);
        setCategories(cats);
        setFavorites(new Set(favIds));
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    };
    loadInitialData();
  }, [isAuthenticated]);

  // Cargar negocios
  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.searchBusinesses({
        query: searchQuery || undefined,
        category:
          selectedCategory !== "all"
            ? (selectedCategory as BusinessCategory)
            : undefined,
        city: locationQuery || undefined,
        sortBy: filters.sortBy !== "rating" ? filters.sortBy : undefined,
        minRating: filters.minRating > 0 ? filters.minRating : undefined,
        page,
        size: 12,
      });
      setBusinesses(response.content);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error("Error loading businesses:", err);
      setError(
        "Error al cargar los establecimientos. Por favor, intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, locationQuery, selectedCategory, filters, page]);

  // Cargar negocios al cambiar filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBusinesses();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [loadBusinesses]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setLocationQuery(value);
    setPage(0);
  }, []);

  const handleSearch = useCallback(() => {
    setPage(0);
    // loadBusinesses will be triggered by the useEffect debounce when page/filters change
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(0);
  }, []);

  const handleToggleFavorite = useCallback(
    async (id: number) => {
      if (!isAuthenticated) {
        router.push(
          `/login?returnTo=${encodeURIComponent(window.location.pathname)}`,
        );
        return;
      }
      try {
        const result = await api.toggleFavorite(id);
        setFavorites((prev) => {
          const newSet = new Set(prev);
          if (result.isFavorite) {
            newSet.add(id);
          } else {
            newSet.delete(id);
          }
          return newSet;
        });
      } catch (err) {
        console.error("Error toggling favorite:", err);
      }
    },
    [isAuthenticated, router],
  );

  const handleViewDetails = useCallback(
    (id: number) => {
      router.push(`/negocio/${id}`);
    },
    [router],
  );

  const handleFilterToggle = useCallback(() => {
    setShowFilterPanel((prev) => !prev);
  }, []);

  const handleFilterClose = useCallback(() => {
    setShowFilterPanel(false);
  }, []);

  const handleFilterApply = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  return (
    <div className="home-container">
      <Navbar />

      <main className="home-main">
        {/* Hero Section con título y búsqueda */}
        <section className="home-hero">
          <div className="home-hero-content">
            {/* Título */}
            <div className="home-title-container">
              <h1 className="home-title">
                Encuentra y reserva los mejores{" "}
                <span className="home-title-accent">lugares</span>
              </h1>
              <p className="home-subtitle">
                Barberías, spas, salones de belleza y más. Todo en un solo
                lugar.
              </p>
            </div>

            {/* Barra de búsqueda */}
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              locationQuery={locationQuery}
              onLocationChange={handleLocationChange}
              onSearch={handleSearch}
            />

            {/* Filtros de categoría */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              categories={categories}
            />
          </div>
        </section>

        {/* Estado de carga */}
        {loading && (
          <div className="home-loading">
            <SkeletonGrid count={6} />
          </div>
        )}

        {/* Mensaje de error */}
        {error && !loading && (
          <div className="home-error">
            <p>{error}</p>
            <button onClick={loadBusinesses} className="home-retry-btn">
              Reintentar
            </button>
          </div>
        )}

        {/* Grid de establecimientos */}
        {!loading && !error && (
          <>
            <EstablishmentGrid
              businesses={businesses}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onViewDetails={handleViewDetails}
              showFilterPanel={showFilterPanel}
              onFilterToggle={handleFilterToggle}
              filters={filters}
              onFilterApply={handleFilterApply}
              onFilterClose={handleFilterClose}
            />

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="home-pagination">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="pagination-btn"
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="pagination-btn"
                >
                  Siguiente
                </button>
              </div>
            )}

            {/* Mensaje de vacío */}
            {businesses.length === 0 && (
              <div className="home-empty">
                <p>
                  No se encontraron establecimientos con los filtros
                  seleccionados.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-content">
          <div className="home-footer-logo">
            <BookOpen size={24} className="home-footer-logo-icon" />
            <span className="home-footer-logo-text">BOOKHUB</span>
          </div>
          <p className="home-footer-copyright">
            © 2026 BookHub. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Componente principal - accesible sin autenticación (landing page)
export default function HomePage() {
  return <HomePageContent />;
}
