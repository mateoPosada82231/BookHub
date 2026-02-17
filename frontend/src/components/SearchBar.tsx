"use client";

import { memo, useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faLocationDot,
  faLocationCrosshairs,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { reverseGeocode } from "@/lib/geocoding";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  locationQuery: string;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
}

function SearchBarComponent({
  searchQuery,
  onSearchChange,
  locationQuery,
  onLocationChange,
  onSearch,
}: SearchBarProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        onSearch();
      }
    },
    [onSearch],
  );

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("La geolocalización no está disponible en tu navegador");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const result = await reverseGeocode(latitude, longitude);
          // Usar la ciudad detectada si está disponible, sino coordenadas formateadas
          const locationString =
            result.city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          onLocationChange(locationString);
        } catch (error) {
          console.error("Error al obtener la dirección:", error);
          setLocationError("Error al obtener la dirección");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permiso de ubicación denegado");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Ubicación no disponible");
            break;
          case error.TIMEOUT:
            setLocationError("Tiempo de espera agotado");
            break;
          default:
            setLocationError("Error desconocido al obtener ubicación");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      },
    );
  }, [onLocationChange]);

  return (
    <div className="search-container">
      <div className="search-wrapper">
        <div className="search-field search-field-main">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="¿Qué estás buscando?"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="search-input"
            aria-label="Buscar establecimientos"
          />
        </div>
        <div className="search-field search-field-location">
          <FontAwesomeIcon icon={faLocationDot} className="search-icon" />
          <input
            type="text"
            placeholder="Ubicación"
            value={locationQuery}
            onChange={(e) => onLocationChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="search-input"
            aria-label="Ubicación"
          />
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="location-button"
            aria-label="Usar mi ubicación actual"
            title="Usar mi ubicación actual"
          >
            <FontAwesomeIcon
              icon={isGettingLocation ? faSpinner : faLocationCrosshairs}
              className={`location-button-icon ${isGettingLocation ? "fa-spin" : ""}`}
            />
          </button>
        </div>
        <button
          onClick={onSearch}
          className="search-button"
          aria-label="Buscar"
        >
          <FontAwesomeIcon icon={faSearch} className="search-button-icon" />
          <span>Buscar</span>
        </button>
      </div>

      {/* Mostrar errores de ubicación */}
      {locationError && (
        <div className="location-error" role="alert">
          {locationError}
        </div>
      )}
    </div>
  );
}

export const SearchBar = memo(SearchBarComponent);
