package com.bookhub.backend.api.dto.business;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.bookhub.backend.domain.business.BusinessCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Simplified business response for search results and listings.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BusinessSummaryResponse {

    private Long id;
    private String name;
    private BusinessCategory category;

    @JsonProperty("category_display")
    private String categoryDisplay;

    private String address;
    private String city;

    @JsonProperty("cover_image_url")
    private String coverImageUrl;

    @JsonProperty("average_rating")
    private BigDecimal averageRating;

    @JsonProperty("total_reviews")
    private Integer totalReviews;

    @JsonProperty("services_count")
    private Integer servicesCount;
}

