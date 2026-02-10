package com.bookhub.backend.api.dto.business;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ServiceResponse {

    private Long id;
    private String name;
    private String description;

    @JsonProperty("duration_minutes")
    private Integer durationMinutes;

    private BigDecimal price;

    @JsonProperty("image_url")
    private String imageUrl;

    private boolean active;

    @JsonProperty("business_id")
    private Long businessId;

    @JsonProperty("business_name")
    private String businessName;
}
