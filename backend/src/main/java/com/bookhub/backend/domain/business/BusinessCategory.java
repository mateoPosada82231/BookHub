package com.bookhub.backend.domain.business;

/**
 * Categories of businesses available on the platform.
 * Used for filtering and discovery.
 */
public enum BusinessCategory {
    BARBERSHOP("Barbería"),
    HAIR_SALON("Salón de Belleza"),
    NAIL_SALON("Manicura/Pedicura"),
    SPA("Spa"),
    CAR_WASH("Autolavado"),
    PET_GROOMING("Peluquería de Mascotas"),
    TATTOO_STUDIO("Estudio de Tatuajes"),
    OTHER("Otro");

    private final String displayName;

    BusinessCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
