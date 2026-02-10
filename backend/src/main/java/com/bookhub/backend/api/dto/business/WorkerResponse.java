package com.bookhub.backend.api.dto.business;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WorkerResponse {

    private Long id;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    private String position;
    private boolean active;

    @JsonProperty("business_id")
    private Long businessId;

    @JsonProperty("business_name")
    private String businessName;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    private List<WorkerScheduleResponse> schedules;
}
