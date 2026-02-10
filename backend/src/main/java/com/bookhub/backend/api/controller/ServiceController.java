package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.service.ServiceManagementService;
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
@RequestMapping("/api/businesses/{businessId}/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceManagementService serviceManagementService;

    /**
     * Get all services for a business (public)
     */
    @GetMapping
    public ResponseEntity<List<ServiceResponse>> getServices(@PathVariable Long businessId) {
        return ResponseEntity.ok(serviceManagementService.getServicesByBusiness(businessId));
    }

    /**
     * Get service by ID
     */
    @GetMapping("/{serviceId}")
    public ResponseEntity<ServiceResponse> getServiceById(
            @PathVariable Long businessId,
            @PathVariable Long serviceId) {
        return ResponseEntity.ok(serviceManagementService.getServiceById(serviceId));
    }

    /**
     * Create a new service
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ServiceResponse> createService(
            @PathVariable Long businessId,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody CreateServiceRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceManagementService.createService(businessId, user.getId(), request));
    }

    /**
     * Update service
     */
    @PutMapping("/{serviceId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ServiceResponse> updateService(
            @PathVariable Long businessId,
            @PathVariable Long serviceId,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody UpdateServiceRequest request) {

        return ResponseEntity.ok(serviceManagementService.updateService(serviceId, user.getId(), request));
    }

    /**
     * Delete service (soft delete)
     */
    @DeleteMapping("/{serviceId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteService(
            @PathVariable Long businessId,
            @PathVariable Long serviceId,
            @AuthenticationPrincipal SecurityUser user) {

        serviceManagementService.deleteService(serviceId, user.getId());
        return ResponseEntity.noContent().build();
    }
}

