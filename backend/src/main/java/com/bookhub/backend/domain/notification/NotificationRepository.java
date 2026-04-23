package com.bookhub.backend.domain.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndReadFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.read = true, n.readAt = :readAt
            WHERE n.user.id = :userId AND n.read = false
            """)
    int markAllAsReadByUserId(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("""
            DELETE FROM Notification n
            WHERE n.read = true AND n.readAt IS NOT NULL AND n.readAt < :threshold
            """)
    int deleteReadNotificationsBefore(@Param("threshold") LocalDateTime threshold);
}
