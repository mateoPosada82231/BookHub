package com.bookhub.backend.api.dto.appointment;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateAppointmentRequest {

    @NotNull(message = "El ID del trabajador es obligatorio")
    @JsonProperty("worker_id")
    private Long workerId;

    @NotNull(message = "El ID del servicio es obligatorio")
    @JsonProperty("service_id")
    private Long serviceId;

    @NotNull(message = "La fecha y hora de inicio es obligatoria")
    @Future(message = "La cita debe ser en el futuro")
    @JsonProperty("start_time")
    private LocalDateTime startTime;

    @Size(max = 500, message = "Las notas no pueden exceder 500 caracteres")
    @JsonProperty("client_notes")
    private String clientNotes;
}
