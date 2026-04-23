package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.dto.notification.NotificationResponse;
import com.bookhub.backend.api.service.NotificationService;
import com.bookhub.backend.config.SecurityUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notificaciones en tiempo real y persistentes")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar notificaciones del usuario autenticado")
    public ResponseEntity<PageResponse<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(notificationService.getNotifications(user.getId(), page, size));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Contar notificaciones no leídas")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal SecurityUser user
    ) {
        long unreadCount = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("unread_count", unreadCount));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Marcar una notificación como leída")
    public ResponseEntity<NotificationResponse> markAsRead(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(user.getId(), id));
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Marcar todas las notificaciones como leídas")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(
            @AuthenticationPrincipal SecurityUser user
    ) {
        return ResponseEntity.ok(notificationService.markAllAsRead(user.getId()));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Suscripción SSE para notificaciones en vivo")
    public SseEmitter stream(
            @AuthenticationPrincipal SecurityUser user
    ) {
        return notificationService.subscribe(user.getId());
    }
}
