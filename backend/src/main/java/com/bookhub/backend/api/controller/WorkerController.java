package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.service.WorkerService;
import com.bookhub.backend.config.SecurityUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/businesses/{businessId}/workers")
@RequiredArgsConstructor
public class WorkerController {

    private final WorkerService workerService;

    /**
     * Get all workers for a business (public)
     */
    @GetMapping
    public ResponseEntity<List<WorkerResponse>> getWorkers(@PathVariable Long businessId) {
        return ResponseEntity.ok(workerService.getWorkersByBusiness(businessId));
    }

    /**
     * Get worker by ID
     */
    @GetMapping("/{workerId}")
    public ResponseEntity<WorkerResponse> getWorkerById(
            @PathVariable Long businessId,
            @PathVariable Long workerId) {
        return ResponseEntity.ok(workerService.getWorkerById(workerId));
    }

    /**
     * Add a worker to the business
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkerResponse> addWorker(
            @PathVariable Long businessId,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody CreateWorkerRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workerService.addWorker(businessId, user.getId(), request));
    }

    /**
     * Update worker
     */
    @PutMapping("/{workerId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WorkerResponse> updateWorker(
            @PathVariable Long businessId,
            @PathVariable Long workerId,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody UpdateWorkerRequest request) {

        return ResponseEntity.ok(workerService.updateWorker(workerId, user.getId(), request));
    }

    /**
     * Remove worker (soft delete)
     */
    @DeleteMapping("/{workerId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> removeWorker(
            @PathVariable Long businessId,
            @PathVariable Long workerId,
            @AuthenticationPrincipal SecurityUser user) {

        workerService.removeWorker(workerId, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Set worker schedule
     */
    @PutMapping("/{workerId}/schedule")
    @PreAuthorize("hasAnyRole('OWNER', 'WORKER')")
    public ResponseEntity<WorkerResponse> setWorkerSchedule(
            @PathVariable Long businessId,
            @PathVariable Long workerId,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody List<WorkerScheduleRequest> schedules) {

        return ResponseEntity.ok(workerService.setWorkerSchedule(workerId, user.getId(), schedules));
    }
}

