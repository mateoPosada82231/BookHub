package com.bookhub.backend.api.dto.business;

import com.bookhub.backend.domain.business.BusinessCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateBusinessRequest {

    @NotBlank(message = "El nombre del negocio es obligatorio")
    @Size(max = 255, message = "El nombre no puede exceder 255 caracteres")
    private String name;

    @NotNull(message = "La categoría es obligatoria")
    private BusinessCategory category;

    @Size(max = 2000, message = "La descripción no puede exceder 2000 caracteres")
    private String description;

    @Size(max = 500, message = "La dirección no puede exceder 500 caracteres")
    private String address;

    @Size(max = 100, message = "La ciudad no puede exceder 100 caracteres")
    private String city;

    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String phone;

    @JsonProperty("cover_image_url")
    private String coverImageUrl;
}
