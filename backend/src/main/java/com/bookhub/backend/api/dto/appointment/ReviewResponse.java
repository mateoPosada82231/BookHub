package com.bookhub.backend.api.dto.appointment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponse {

    private Long id;
    private Integer rating;
    private String comment;

    @JsonProperty("appointment_id")
    private Long appointmentId;

    @JsonProperty("client_name")
    private String clientName;

    @JsonProperty("service_name")
    private String serviceName;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}

