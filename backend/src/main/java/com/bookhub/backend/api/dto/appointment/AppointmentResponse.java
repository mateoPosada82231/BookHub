package com.bookhub.backend.api.dto.appointment;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.bookhub.backend.domain.booking.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentResponse {

    private Long id;

    // Client info
    @JsonProperty("client_id")
    private Long clientId;

    @JsonProperty("client_name")
    private String clientName;

    @JsonProperty("client_phone")
    private String clientPhone;

    // Worker info
    @JsonProperty("worker_id")
    private Long workerId;

    @JsonProperty("worker_name")
    private String workerName;

    // Service info
    @JsonProperty("service_id")
    private Long serviceId;

    @JsonProperty("service_name")
    private String serviceName;

    @JsonProperty("service_price")
    private BigDecimal servicePrice;

    @JsonProperty("service_duration")
    private Integer serviceDuration;

    // Business info
    @JsonProperty("business_id")
    private Long businessId;

    @JsonProperty("business_name")
    private String businessName;

    @JsonProperty("business_address")
    private String businessAddress;

    // Appointment details
    @JsonProperty("start_time")
    private LocalDateTime startTime;

    @JsonProperty("end_time")
    private LocalDateTime endTime;

    private AppointmentStatus status;

    @JsonProperty("client_notes")
    private String clientNotes;

    @JsonProperty("cancellation_reason")
    private String cancellationReason;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    // Review info (if exists)
    @JsonProperty("has_review")
    private boolean hasReview;

    @JsonProperty("review")
    private ReviewResponse review;
}

