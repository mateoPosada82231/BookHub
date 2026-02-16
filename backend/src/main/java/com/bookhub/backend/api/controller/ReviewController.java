package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.appointment.ReviewResponse;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/businesses/{businessId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Gestión de reseñas de negocios")
public class ReviewController {

    private final AppointmentService appointmentService;

    /**
     * Get paginated reviews for a business (public)
     */
    @GetMapping
    @Operation(summary = "Obtener reseñas de un negocio", description = "Retorna las reseñas paginadas de un negocio")
    public ResponseEntity<PageResponse<ReviewResponse>> getBusinessReviews(
            @Parameter(description = "ID del negocio") @PathVariable Long businessId,
            @Parameter(description = "Número de página (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(appointmentService.getBusinessReviews(businessId, page, size));
    }
}

