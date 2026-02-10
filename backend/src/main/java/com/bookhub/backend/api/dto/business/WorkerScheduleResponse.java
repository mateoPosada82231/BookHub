package com.bookhub.backend.api.dto.business;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WorkerScheduleResponse {

    private Long id;

    @JsonProperty("day_of_week")
    private Integer dayOfWeek;

    @JsonProperty("day_name")
    private String dayName;

    @JsonProperty("start_time")
    private LocalTime startTime;

    @JsonProperty("end_time")
    private LocalTime endTime;

    @JsonProperty("is_available")
    private boolean available;
}

