package com.bookhub.backend.domain.business;

import com.bookhub.backend.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Worker entity linking a user to a business as an employee.
 * A user with WORKER role must have at least one Worker record.
 */
@Entity
@Table(name = "workers", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "business_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    /**
     * Position/title within the business (e.g., "Senior Barber", "Junior Stylist")
     */
    @Column(length = 100)
    private String position;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Worker's schedule
    @OneToMany(mappedBy = "worker", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkerSchedule> schedules = new ArrayList<>();
}
