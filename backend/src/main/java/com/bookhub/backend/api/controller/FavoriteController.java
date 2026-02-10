package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.business.BusinessSummaryResponse;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.service.FavoriteService;
import com.bookhub.backend.config.SecurityUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Tag(name = "Favorites", description = "Gestión de favoritos")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener favoritos del usuario actual (paginado)")
    public ResponseEntity<PageResponse<BusinessSummaryResponse>> getMyFavorites(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(favoriteService.getUserFavorites(user.getId(), page, size));
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener todos los favoritos del usuario actual")
    public ResponseEntity<List<BusinessSummaryResponse>> getAllMyFavorites(
            @AuthenticationPrincipal SecurityUser user
    ) {
        return ResponseEntity.ok(favoriteService.getAllUserFavorites(user.getId()));
    }

    @GetMapping("/ids")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener IDs de negocios favoritos")
    public ResponseEntity<Set<Long>> getMyFavoriteIds(
            @AuthenticationPrincipal SecurityUser user
    ) {
        return ResponseEntity.ok(favoriteService.getUserFavoriteIds(user.getId()));
    }

    @GetMapping("/check/{businessId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Verificar si un negocio es favorito")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable Long businessId
    ) {
        boolean isFavorite = favoriteService.isFavorite(user.getId(), businessId);
        return ResponseEntity.ok(Map.of("is_favorite", isFavorite));
    }

    @PostMapping("/{businessId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Agregar negocio a favoritos")
    public ResponseEntity<Map<String, Object>> addFavorite(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable Long businessId
    ) {
        favoriteService.addFavorite(user.getId(), businessId);
        return ResponseEntity.ok(Map.of(
            "message", "Negocio agregado a favoritos",
            "is_favorite", true
        ));
    }

    @DeleteMapping("/{businessId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Eliminar negocio de favoritos")
    public ResponseEntity<Map<String, Object>> removeFavorite(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable Long businessId
    ) {
        favoriteService.removeFavorite(user.getId(), businessId);
        return ResponseEntity.ok(Map.of(
            "message", "Negocio eliminado de favoritos",
            "is_favorite", false
        ));
    }

    @PostMapping("/{businessId}/toggle")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Alternar favorito (agregar/quitar)")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable Long businessId
    ) {
        boolean isFavorite = favoriteService.toggleFavorite(user.getId(), businessId);
        String message = isFavorite ? "Negocio agregado a favoritos" : "Negocio eliminado de favoritos";
        return ResponseEntity.ok(Map.of(
            "message", message,
            "is_favorite", isFavorite
        ));
    }

    @GetMapping("/count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Contar favoritos del usuario")
    public ResponseEntity<Map<String, Long>> countFavorites(
            @AuthenticationPrincipal SecurityUser user
    ) {
        long count = favoriteService.countUserFavorites(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }
}
