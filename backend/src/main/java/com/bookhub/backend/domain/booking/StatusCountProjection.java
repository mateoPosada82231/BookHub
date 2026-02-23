package com.bookhub.backend.domain.booking;

/**
 * Projection for status count query results.
 */
public interface StatusCountProjection {
    String getStatus();
    Long getCount();
}
