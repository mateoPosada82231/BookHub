package com.bookhub.backend.domain.booking;

/**
 * Projection for business rating statistics query.
 */
public interface RatingStatsProjection {
    Double getAverageRating();
    Long getTotalReviews();
}
