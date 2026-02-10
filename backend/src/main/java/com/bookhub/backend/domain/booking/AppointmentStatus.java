package com.bookhub.backend.domain.booking;

/**
 * Status of an appointment through its lifecycle.
 */
public enum AppointmentStatus {
    /**
     * Appointment created but not yet confirmed by the business/worker
     */
    PENDING,

    /**
     * Appointment confirmed and scheduled
     */
    CONFIRMED,

    /**
     * Appointment successfully completed
     */
    COMPLETED,

    /**
     * Appointment cancelled by either party
     */
    CANCELLED,

    /**
     * Client did not show up
     */
    NO_SHOW
}
