package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.service.BusinessService;
import com.bookhub.backend.config.SecurityUser;
import com.bookhub.backend.domain.business.BusinessCategory;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/businesses")
@RequiredArgsConstructor
public class BusinessController {

    private final BusinessService businessService;

    /**
     * Search businesses with filters (public)
     */
    @GetMapping("/search")
    public ResponseEntity<PageResponse<BusinessSummaryResponse>> searchBusinesses(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) BusinessCategory category,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(businessService.searchBusinesses(query, category, city, page, size));
    }

    /**
     * Get business by ID (public)
     */
    @GetMapping("/{id}")
    public ResponseEntity<BusinessResponse> getBusinessById(@PathVariable Long id) {
        return ResponseEntity.ok(businessService.getBusinessById(id));
    }

    /**
     * Get my businesses (owner)
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<BusinessSummaryResponse>> getMyBusinesses(
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(businessService.getMyBusinesses(user.getId()));
    }

    /**
     * Create a new business
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<BusinessResponse> createBusiness(
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody CreateBusinessRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(businessService.createBusiness(user.getId(), request));
    }

    /**
     * Update business
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<BusinessResponse> updateBusiness(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody UpdateBusinessRequest request) {

        return ResponseEntity.ok(businessService.updateBusiness(id, user.getId(), request));
    }

    /**
     * Delete business (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteBusiness(
            @PathVariable Long id,
            @AuthenticationPrincipal SecurityUser user) {

        businessService.deleteBusiness(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all business categories
     */
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        List<CategoryResponse> categories = java.util.Arrays.stream(BusinessCategory.values())
                .map(c -> new CategoryResponse(c.name(), c.getDisplayName()))
                .toList();
        return ResponseEntity.ok(categories);
    }

    /**
     * Simple DTO for categories
     */
    public record CategoryResponse(String value, String label) {
    }
}

