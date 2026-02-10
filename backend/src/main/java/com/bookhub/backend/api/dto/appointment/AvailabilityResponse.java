package com.bookhub.backend.api.dto.appointment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AvailabilityResponse {

    @JsonProperty("worker_id")
    private Long workerId;

    @JsonProperty("worker_name")
    private String workerName;

    private LocalDate date;

    @JsonProperty("available_slots")
    private List<TimeSlot> availableSlots;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TimeSlot {
        @JsonProperty("start_time")
        private LocalTime startTime;

        @JsonProperty("end_time")
        private LocalTime endTime;

        private boolean available;
    }
}
