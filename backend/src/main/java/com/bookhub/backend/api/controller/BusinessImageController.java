package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.business.AddBusinessImageRequest;
import com.bookhub.backend.api.dto.business.BusinessImageResponse;
import com.bookhub.backend.api.service.BusinessImageService;
import com.bookhub.backend.config.SecurityUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/businesses/{businessId}/images")
@RequiredArgsConstructor
public class BusinessImageController {

    private final BusinessImageService businessImageService;

    /**
     * Get all images for a business (public)
     */
    @GetMapping
    public ResponseEntity<List<BusinessImageResponse>> getBusinessImages(@PathVariable Long businessId) {
        return ResponseEntity.ok(businessImageService.getBusinessImages(businessId));
    }

    /**
     * Add an image to business gallery (owner only)
     */
    @PostMapping
    public ResponseEntity<BusinessImageResponse> addImage(
            @PathVariable Long businessId,
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody AddBusinessImageRequest request) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(businessImageService.addImage(businessId, user.getId(), request));
    }

    /**
     * Remove an image from business gallery (owner only)
     */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> removeImage(
            @PathVariable Long businessId,
            @PathVariable Long imageId,
            @AuthenticationPrincipal SecurityUser user) {
        
        businessImageService.removeImage(businessId, imageId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
