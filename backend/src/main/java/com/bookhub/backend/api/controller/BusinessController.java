package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.service.BusinessService;
import com.bookhub.backend.config.SecurityUser;
import com.bookhub.backend.domain.business.BusinessCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Businesses", description = "Gestión de negocios")
public class BusinessController {

    private final BusinessService businessService;

    /**
     * Search businesses with filters (public)
     */
    @GetMapping("/search")
    @Operation(summary = "Buscar negocios", description = "Búsqueda pública paginada por nombre, categoría o ciudad")
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
    @Operation(summary = "Obtener negocio por ID", description = "Retorna el detalle completo de un negocio")
    public ResponseEntity<BusinessResponse> getBusinessById(@PathVariable Long id) {
        return ResponseEntity.ok(businessService.getBusinessById(id));
    }

    /**
     * Get my businesses (owner)
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Mis negocios", description = "Lista los negocios del propietario actual")
    public ResponseEntity<List<BusinessSummaryResponse>> getMyBusinesses(
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(businessService.getMyBusinesses(user.getId()));
    }

    /**
     * Create a new business
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Crear negocio", description = "Registra un nuevo negocio (solo OWNER)")
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
    @Operation(summary = "Actualizar negocio")
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
    @Operation(summary = "Eliminar negocio", description = "Desactiva un negocio (soft delete)")
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
    @Operation(summary = "Listar categorías", description = "Retorna todas las categorías de negocio disponibles")
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

