package com.bookhub.backend.api.dto.business;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WorkerScheduleRequest {

    @NotNull(message = "El día de la semana es obligatorio")
    @Min(value = 0, message = "El día de la semana debe ser entre 0 (domingo) y 6 (sábado)")
    @Max(value = 6, message = "El día de la semana debe ser entre 0 (domingo) y 6 (sábado)")
    @JsonProperty("day_of_week")
    private Integer dayOfWeek;

    @NotNull(message = "La hora de inicio es obligatoria")
    @JsonProperty("start_time")
    private LocalTime startTime;

    @NotNull(message = "La hora de fin es obligatoria")
    @JsonProperty("end_time")
    private LocalTime endTime;

    @Builder.Default
    @JsonProperty("is_available")
    private Boolean available = true;
}

