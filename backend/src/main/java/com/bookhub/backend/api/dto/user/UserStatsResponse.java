package com.bookhub.backend.api.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {

    @JsonProperty("total_appointments")
    private long totalAppointments;

    @JsonProperty("total_favorites")
    private long totalFavorites;

    @JsonProperty("total_reviews")
    private long totalReviews;
}
