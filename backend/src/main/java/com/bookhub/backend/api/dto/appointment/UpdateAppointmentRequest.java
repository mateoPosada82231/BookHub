package com.bookhub.backend.api.dto.appointment;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.bookhub.backend.domain.booking.AppointmentStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateAppointmentRequest {

    private AppointmentStatus status;

    @Size(max = 500, message = "La razón de cancelación no puede exceder 500 caracteres")
    @JsonProperty("cancellation_reason")
    private String cancellationReason;
}

