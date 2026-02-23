package com.bookhub.backend.api.dto.business;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Statistics for a business: appointment counts, revenue, etc.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BusinessStatsResponse {

    @JsonProperty("appointments_today")
    private long appointmentsToday;

    @JsonProperty("appointments_this_week")
    private long appointmentsThisWeek;

    @JsonProperty("appointments_this_month")
    private long appointmentsThisMonth;

    @JsonProperty("revenue_this_week")
    private BigDecimal revenueThisWeek;

    @JsonProperty("revenue_this_month")
    private BigDecimal revenueThisMonth;

    @JsonProperty("total_reviews")
    private int totalReviews;

    @JsonProperty("average_rating")
    private BigDecimal averageRating;

    @JsonProperty("status_counts")
    private Map<String, Long> statusCounts;
}
