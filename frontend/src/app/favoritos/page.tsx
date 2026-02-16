"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, RefreshCw, AlertCircle, X, ArrowRight } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Navbar } from "@/components/Navbar";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useMyFavorites } from "@/hooks";
import { api } from "@/lib/api";
import "@/styles/favoritos.css";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

function FavoritosContent() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    data: favorites = [],
    error: swrError,
    isLoading,
    mutate,
  } = useMyFavorites();
  const [localError, setLocalError] = useState<string | null>(null);

  const favoriteIds = new Set(favorites.map((b) => b.id));
  const error =
    localError ||
    (swrError ? swrError.message || "Error al cargar los favoritos" : null);

  const handleToggleFavorite = async (businessId: number) => {
    try {
      await api.removeFavorite(businessId);
      mutate(
        favorites.filter((b) => b.id !== businessId),
        false,
      );
    } catch (err: any) {
      setLocalError(err.message || "Error al eliminar de favoritos");
    }
  };

  const handleViewDetails = (businessId: number) => {
    router.push(`/negocio/${businessId}`);
  };

  return (
    <div className="favoritos-page">
      <Navbar />

      <main className="favoritos-main">
        <div className="favoritos-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="favoritos-header"
          >
            <div className="favoritos-header-content">
              <div className="favoritos-header-title">
                <div className="favoritos-icon-wrapper">
                  <Heart className="favoritos-icon" />
                </div>
                <h1 className="favoritos-title">Mis Favoritos</h1>
              </div>
              <p className="favoritos-subtitle">
                {favorites.length}{" "}
                {favorites.length === 1
                  ? "lugar guardado"
                  : "lugares guardados"}
              </p>
            </div>
            <button
              onClick={() => mutate()}
              disabled={isLoading}
              className="favoritos-refresh-btn"
              title="Recargar favoritos"
            >
              <RefreshCw className={isLoading ? "animate-spin" : ""} />
            </button>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="favoritos-error"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
                <button
                  onClick={() => setLocalError(null)}
                  className="favoritos-error-close"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading && (
            <LoadingSpinner
              size="lg"
              message="Cargando favoritos..."
              fullScreen
            />
          )}

          {/* Favorites Grid */}
          {!isLoading && favorites.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="favoritos-grid"
            >
              {favorites.map((business, index) => (
                <motion.div
                  key={business.id}
                  variants={fadeIn}
                  className="favoritos-grid-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <EstablishmentCard
                    business={business}
                    isFavorite={favoriteIds.has(business.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onViewDetails={handleViewDetails}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && favorites.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="favoritos-empty"
            >
              <div className="favoritos-empty-icon-wrapper">
                <Heart />
              </div>
              <h3 className="favoritos-empty-title">
                No tienes favoritos guardados
              </h3>
              <p className="favoritos-empty-text">
                Explora los establecimientos y guarda tus favoritos tocando el
                corazón para encontrarlos fácilmente después
              </p>
              <button
                onClick={() => router.push("/")}
                className="favoritos-empty-btn"
              >
                Explorar lugares
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function FavoritosPage() {
  return (
    <ProtectedRoute>
      <FavoritosContent />
    </ProtectedRoute>
  );
}
