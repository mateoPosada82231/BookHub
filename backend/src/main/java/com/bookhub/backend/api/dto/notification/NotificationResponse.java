package com.bookhub.backend.api.dto.notification;

import com.bookhub.backend.domain.notification.NotificationType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;

    private String title;

    private String message;

    private NotificationType type;

    @JsonProperty("is_read")
    private boolean read;

    @JsonProperty("read_at")
    private LocalDateTime readAt;

    @JsonProperty("entity_type")
    private String entityType;

    @JsonProperty("entity_id")
    private Long entityId;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
