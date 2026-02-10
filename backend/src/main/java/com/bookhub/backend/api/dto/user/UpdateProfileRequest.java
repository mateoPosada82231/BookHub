package com.bookhub.backend.api.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 255, message = "El nombre no puede exceder 255 caracteres")
    @JsonProperty("full_name")
    private String fullName;

    @Size(max = 500, message = "La bio no puede exceder 500 caracteres")
    private String bio;

    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String phone;

    @JsonProperty("avatar_url")
    private String avatarUrl;
}

