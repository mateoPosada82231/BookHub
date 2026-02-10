package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.appointment.*;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.service.AppointmentService;
import com.bookhub.backend.config.SecurityUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    /**
     * Create a new appointment
     */
    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody CreateAppointmentRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createAppointment(user.getId(), request));
    }

    /**
     * Get appointment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user) {

        return ResponseEntity.ok(appointmentService.getAppointmentById(id, user.getId()));
    }

    /**
     * Get my appointments (as client)
     */
    @GetMapping("/my")
    public ResponseEntity<PageResponse<AppointmentResponse>> getMyAppointments(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(appointmentService.getClientAppointments(user.getId(), page, size));
    }

    /**
     * Get my upcoming appointments (as client)
     */
    @GetMapping("/my/upcoming")
    public ResponseEntity<List<AppointmentResponse>> getMyUpcomingAppointments(
            @AuthenticationPrincipal SecurityUser user) {

        return ResponseEntity.ok(appointmentService.getUpcomingClientAppointments(user.getId()));
    }

    /**
     * Get appointments for a worker
     */
    @GetMapping("/worker/{workerId}")
    public ResponseEntity<PageResponse<AppointmentResponse>> getWorkerAppointments(
            @PathVariable Long workerId,
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(appointmentService.getWorkerAppointments(workerId, user.getId(), page, size));
    }

    /**
     * Get upcoming appointments for a worker
     */
    @GetMapping("/worker/{workerId}/upcoming")
    public ResponseEntity<List<AppointmentResponse>> getUpcomingWorkerAppointments(
            @PathVariable Long workerId,
            @AuthenticationPrincipal SecurityUser user) {

        return ResponseEntity.ok(appointmentService.getUpcomingWorkerAppointments(workerId, user.getId()));
    }

    /**
     * Update appointment (status change)
     */
    @PatchMapping("/{id}")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody UpdateAppointmentRequest request) {

        return ResponseEntity.ok(appointmentService.updateAppointment(id, user.getId(), request));
    }

    /**
     * Cancel appointment
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam(required = false) String reason) {

        return ResponseEntity.ok(appointmentService.cancelAppointment(id, user.getId(), reason));
    }

    /**
     * Add review to appointment
     */
    @PostMapping("/{id}/review")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody CreateReviewRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createReview(id, user.getId(), request));
    }

    /**
     * Get worker availability for a specific date
     */
    @GetMapping("/availability/{workerId}")
    public ResponseEntity<AvailabilityResponse> getWorkerAvailability(
            @PathVariable Long workerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer duration) {

        return ResponseEntity.ok(appointmentService.getWorkerAvailability(workerId, date, duration));
    }
}

