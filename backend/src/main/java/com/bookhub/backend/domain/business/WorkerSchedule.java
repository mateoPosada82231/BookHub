package com.bookhub.backend.domain.business;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * Worker's weekly schedule.
 * Defines availability for each day of the week.
 */
@Entity
@Table(name = "worker_schedules", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "worker_id", "day_of_week" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    /**
     * Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
     */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Builder.Default
    @Column(name = "is_available", nullable = false)
    private boolean available = true;
}
