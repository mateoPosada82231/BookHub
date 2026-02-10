package com.bookhub.backend.domain.booking;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /**
     * Find appointments for a specific client
     */
    Page<Appointment> findByClientIdOrderByStartTimeDesc(Long clientId, Pageable pageable);

    /**
     * Find appointments for a specific worker
     */
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
     * Find upcoming appointments for a client
     */
    @Query("SELECT a FROM Appointment a WHERE a.client.id = :clientId AND a.startTime >= :now AND a.status IN ('PENDING', 'CONFIRMED') ORDER BY a.startTime ASC")
    List<Appointment> findUpcomingForClient(@Param("clientId") Long clientId, @Param("now") LocalDateTime now);

    /**
     * Find upcoming appointments for a worker
     */
    @Query("SELECT a FROM Appointment a WHERE a.worker.id = :workerId AND a.startTime >= :now AND a.status IN ('PENDING', 'CONFIRMED') ORDER BY a.startTime ASC")
    List<Appointment> findUpcomingForWorker(@Param("workerId") Long workerId, @Param("now") LocalDateTime now);

    /**
     * Count appointments by status for a business (for statistics)
     */
    @Query("SELECT a.status, COUNT(a) FROM Appointment a WHERE a.worker.business.id = :businessId GROUP BY a.status")
    List<Object[]> countByStatusForBusiness(@Param("businessId") Long businessId);

    /**
     * Find appointments for a worker within a date range
     */
    @Query("SELECT a FROM Appointment a WHERE a.worker.id = :workerId AND a.startTime >= :startTime AND a.startTime <= :endTime ORDER BY a.startTime ASC")
    List<Appointment> findByWorkerIdAndDateRange(
            @Param("workerId") Long workerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
