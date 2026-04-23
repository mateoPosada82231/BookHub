package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.dto.notification.NotificationResponse;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.domain.notification.Notification;
import com.bookhub.backend.domain.notification.NotificationRepository;
import com.bookhub.backend.domain.notification.NotificationType;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationRealtimeService realtimeService;

    @Value("${app.notifications.retention-days:90}")
    private int retentionDays;

    @Transactional
    public NotificationResponse createNotification(
            Long userId,
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .entityType(entityType)
                .entityId(entityId)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = toResponse(saved);

        realtimeService.sendNotification(userId, response);
        realtimeService.sendUnreadCount(userId, notificationRepository.countByUserIdAndReadFalse(userId));

        return response;
    }

    @Transactional
    public void createNotificationForUsers(
            Set<Long> userIds,
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId
    ) {
        Set<Long> sanitizedUserIds = userIds.stream()
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());

        for (Long userId : sanitizedUserIds) {
            createNotification(userId, title, message, type, entityType, entityId);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Notification> notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return PageResponse.<NotificationResponse>builder()
                .content(notificationPage.getContent().stream().map(this::toResponse).toList())
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .currentPage(notificationPage.getNumber())
                .pageSize(notificationPage.getSize())
                .first(notificationPage.isFirst())
                .last(notificationPage.isLast())
                .empty(notificationPage.isEmpty())
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación", notificationId));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
            realtimeService.sendUnreadCount(userId, notificationRepository.countByUserIdAndReadFalse(userId));
        }

        return toResponse(notification);
    }

    @Transactional
    public Map<String, Integer> markAllAsRead(Long userId) {
        int updated = notificationRepository.markAllAsReadByUserId(userId, LocalDateTime.now());
        realtimeService.sendUnreadCount(userId, 0);
        return Map.of("updated_count", updated);
    }

    @Transactional(readOnly = true)
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = realtimeService.subscribe(userId);
        realtimeService.sendUnreadCount(userId, getUnreadCount(userId));
        return emitter;
    }

    @Scheduled(fixedRate = 24 * 60 * 60 * 1000)
    @Transactional
    public void cleanupReadNotifications() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);
        int removed = notificationRepository.deleteReadNotificationsBefore(threshold);
        if (removed > 0) {
            log.info("Deleted {} read notifications older than {} days", removed, retentionDays);
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.isRead())
                .readAt(notification.getReadAt())
                .entityType(notification.getEntityType())
                .entityId(notification.getEntityId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
