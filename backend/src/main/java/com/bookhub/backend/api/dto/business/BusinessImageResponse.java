package com.bookhub.backend.api.dto.business;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BusinessImageResponse {

    private Long id;

    @JsonProperty("image_url")
    private String imageUrl;

    private String caption;

    @JsonProperty("display_order")
    private Integer displayOrder;
}
