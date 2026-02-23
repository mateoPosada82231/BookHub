package com.bookhub.backend.api.dto.appointment;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleAppointmentRequest {

    @NotNull(message = "La nueva hora de inicio es requerida")
    @Future(message = "La nueva hora debe ser en el futuro")
    @JsonProperty("new_start_time")
    private LocalDateTime newStartTime;

    @JsonProperty("reason")
    private String reason;
}
