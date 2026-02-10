package com.bookhub.backend.api.dto.business;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.bookhub.backend.domain.business.BusinessCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BusinessResponse {

    private Long id;
    private String name;
    private BusinessCategory category;

    @JsonProperty("category_display")
    private String categoryDisplay;

    private String description;
    private String address;
    private String city;
    private String phone;

    @JsonProperty("cover_image_url")
    private String coverImageUrl;

    private boolean active;

    @JsonProperty("average_rating")
    private BigDecimal averageRating;

    @JsonProperty("total_reviews")
    private Integer totalReviews;

    @JsonProperty("owner_id")
    private Long ownerId;

    @JsonProperty("owner_name")
    private String ownerName;

    @JsonProperty("services_count")
    private Integer servicesCount;

    @JsonProperty("workers_count")
    private Integer workersCount;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    // For detail view
    private List<ServiceResponse> services;
    private List<WorkerResponse> workers;

    @JsonProperty("gallery_images")
    private List<String> galleryImages;
}

