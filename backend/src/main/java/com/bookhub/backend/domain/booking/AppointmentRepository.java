package com.bookhub.backend.domain.booking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /**
     * Find appointment by ID with all relations needed for toResponse()
     */
    @EntityGraph(attributePaths = {"client", "client.profile", "worker", "worker.user", "worker.user.profile", "worker.business", "service", "review"})
    Optional<Appointment> findById(Long id);

    /**
     * Find appointments for a specific client - fetching all relations to avoid N+1
     */
    @EntityGraph(attributePaths = {"client", "client.profile", "worker", "worker.user", "worker.user.profile", "worker.business", "service", "review"})
    Page<Appointment> findByClientIdOrderByStartTimeDesc(Long clientId, Pageable pageable);

    /**
     * Find appointments for a specific worker - fetching all relations to avoid N+1
     */
    @EntityGraph(attributePaths = {"client", "client.profile", "worker", "worker.user", "worker.user.profile", "worker.business", "service", "review"})
    Page<Appointment> findByWorkerIdOrderByStartTimeDesc(Long workerId, Pageable pageable);

    /**
     * Find appointments for a worker in a time range (for availability checking)
     */
    @Query("SELECT a FROM Appointment a WHERE a.worker.id = :workerId AND a.status NOT IN ('CANCELLED', 'NO_SHOW') AND a.startTime < :endTime AND a.endTime > :startTime")
    List<Appointment> findOverlappingAppointments(
            @Param("workerId") Long workerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Find upcoming appointments for a client - with FETCH JOIN for toResponse()
     */
    @Query("""
            SELECT a FROM Appointment a
            JOIN FETCH a.client c
            LEFT JOIN FETCH c.profile
            JOIN FETCH a.worker w
            JOIN FETCH w.user wu
            LEFT JOIN FETCH wu.profile
            JOIN FETCH w.business
            JOIN FETCH a.service
            LEFT JOIN FETCH a.review
            WHERE a.client.id = :clientId AND a.startTime >= :now
            AND a.status IN ('PENDING', 'CONFIRMED')
            ORDER BY a.startTime ASC
            """)
    List<Appointment> findUpcomingForClient(@Param("clientId") Long clientId, @Param("now") LocalDateTime now);

    /**
     * Find upcoming appointments for a worker - with FETCH JOIN for toResponse()
     */
    @Query("""
            SELECT a FROM Appointment a
            JOIN FETCH a.client c
            LEFT JOIN FETCH c.profile
            JOIN FETCH a.worker w
            JOIN FETCH w.user wu
            LEFT JOIN FETCH wu.profile
            JOIN FETCH w.business
            JOIN FETCH a.service
            LEFT JOIN FETCH a.review
            WHERE a.worker.id = :workerId AND a.startTime >= :now
            AND a.status IN ('PENDING', 'CONFIRMED')
            ORDER BY a.startTime ASC
            """)
    List<Appointment> findUpcomingForWorker(@Param("workerId") Long workerId, @Param("now") LocalDateTime now);

    /**
     * Count appointments by status for a business (for statistics)
     */
    @Query("SELECT a.status AS status, COUNT(a) AS count FROM Appointment a WHERE a.worker.business.id = :businessId GROUP BY a.status")
    List<StatusCountProjection> countByStatusForBusiness(@Param("businessId") Long businessId);

    /**
     * Count appointments for a business in a date range
     */
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.worker.business.id = :businessId AND a.startTime >= :start AND a.startTime < :end AND a.status <> 'CANCELLED'")
    long countByBusinessAndDateRange(@Param("businessId") Long businessId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Sum service prices for completed appointments in a date range (revenue)
     */
    @Query("SELECT COALESCE(SUM(a.service.price), 0) FROM Appointment a WHERE a.worker.business.id = :businessId AND a.startTime >= :start AND a.startTime < :end AND a.status = 'COMPLETED'")
    java.math.BigDecimal sumRevenueByBusinessAndDateRange(@Param("businessId") Long businessId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Find appointments for a worker within a date range
     */
    @Query("SELECT a FROM Appointment a WHERE a.worker.id = :workerId AND a.startTime >= :startTime AND a.startTime <= :endTime ORDER BY a.startTime ASC")
    List<Appointment> findByWorkerIdAndDateRange(
            @Param("workerId") Long workerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Calculate average rating for a business using DB aggregation instead of loading all reviews in Java
     */
    @Query("SELECT AVG(r.rating) AS averageRating, COUNT(r) AS totalReviews FROM Review r JOIN r.appointment a JOIN a.worker w WHERE w.business.id = :businessId")
    RatingStatsProjection calculateBusinessRatingStats(@Param("businessId") Long businessId);

    long countByClientId(Long clientId);
}
