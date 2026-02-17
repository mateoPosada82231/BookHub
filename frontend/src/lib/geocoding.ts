/**
 * Servicios de geolocalización y geocoding
 * Para uso futuro con APIs de mapas y geolocalización
 */

export interface GeocodeResult {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface AutocompleteResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Geocoding reverso usando OpenStreetMap Nominatim (gratuito, sin API key)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodeResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`,
      {
        headers: {
          "User-Agent": "BookHub/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      "";

    return {
      address:
        data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city,
      country: address.country || "",
      latitude,
      longitude,
    };
  } catch (error) {
    console.error("Error en geocoding reverso:", error);
    // Fallback: devolver coordenadas formateadas
    return {
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: "",
      country: "",
      latitude,
      longitude,
    };
  }
}

/**
 * Placeholder para autocompletado de lugares
 * TODO: Implementar con Google Places API o servicio similar
 */
export async function searchPlaces(
  query: string,
): Promise<AutocompleteResult[]> {
  // Implementación placeholder
  // En producción, esto haría una llamada a la API de autocompletado
  const mockResults: AutocompleteResult[] = [
    {
      description: `${query} - Resultado 1`,
      place_id: "mock_1",
      structured_formatting: {
        main_text: query,
        secondary_text: "Ciudad, País",
      },
    },
    {
      description: `${query} - Resultado 2`,
      place_id: "mock_2",
      structured_formatting: {
        main_text: query,
        secondary_text: "Otra Ciudad, País",
      },
    },
  ];

  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 300));

  return mockResults;

  // Ejemplo de implementación con Google Places:
  // try {
  //   const response = await fetch(
  //     `/api/places/autocomplete?input=${encodeURIComponent(query)}`
  //   );
  //   const data = await response.json();
  //   return data.predictions;
  // } catch (error) {
  //   throw new Error('Error al buscar lugares');
  // }
}

/**
 * Formatear coordenadas para mostrar al usuario
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}
