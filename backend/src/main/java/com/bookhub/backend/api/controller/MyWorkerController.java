package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.business.WorkerResponse;
import com.bookhub.backend.api.service.WorkerService;
import com.bookhub.backend.config.SecurityUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for worker-specific endpoints (for logged-in workers)
 */
@RestController
@RequestMapping("/api/workers")
@RequiredArgsConstructor
public class MyWorkerController {

    private final WorkerService workerService;

    /**
     * Get current user's worker profiles (businesses where they work)
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<List<WorkerResponse>> getMyWorkerProfiles(
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(workerService.getWorkerProfilesForUser(user.getId()));
    }
}
