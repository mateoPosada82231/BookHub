package com.bookhub.backend.domain.user;

/**
 * Enum representing the different user roles in the system.
 */
public enum UserRole {
    /**
     * Business owner - can manage their establishment, services, workers, and view
     * statistics.
     */
    OWNER,

    /**
     * Worker/Employee - can view their schedule and assigned appointments.
     */
    WORKER,

    /**
     * Client/Customer - can search businesses, book appointments, and view their
     * bookings.
     */
    CLIENT
}
