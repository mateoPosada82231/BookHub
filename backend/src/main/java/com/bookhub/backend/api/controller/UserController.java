package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.user.*;
import com.bookhub.backend.api.service.UserService;
import com.bookhub.backend.config.SecurityUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Gestión de perfil de usuario")
public class UserController {

    private final UserService userService;

    /**
     * Get current user profile
     */
    @GetMapping("/me")
    @Operation(summary = "Obtener mi perfil", description = "Retorna el perfil del usuario autenticado")
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(userService.getCurrentUser(user.getId()));
    }

    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Obtener usuario por ID", description = "Solo el propio usuario puede consultar su perfil por ID")
    public ResponseEntity<UserResponse> getUserById(
            @AuthenticationPrincipal SecurityUser user,
            @PathVariable Long id) {
        if (!user.getId().equals(id)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * Update current user profile
     */
    @PutMapping("/me")
    @Operation(summary = "Actualizar mi perfil")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody UpdateProfileRequest request) {

        return ResponseEntity.ok(userService.updateProfile(user.getId(), request));
    }

    /**
     * Change password
     */
    @PostMapping("/me/change-password")
    @Operation(summary = "Cambiar contraseña")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal SecurityUser user,
            @Valid @RequestBody ChangePasswordRequest request) {

        userService.changePassword(user.getId(), request);
        return ResponseEntity.ok().build();
    }

    /**
     * Find user by email (for adding workers)
     */
    @GetMapping("/search")
    @Operation(summary = "Buscar usuario por email", description = "Solo accesible por usuarios autenticados")
    public ResponseEntity<UserResponse> findByEmail(
            @AuthenticationPrincipal SecurityUser user,
            @RequestParam String email) {
        return ResponseEntity.ok(userService.findByEmail(email));
    }

    /**
     * Get current user stats (appointments, favorites, reviews)
     */
    @GetMapping("/me/stats")
    @Operation(summary = "Obtener estadísticas del usuario actual")
    public ResponseEntity<UserStatsResponse> getMyStats(
            @AuthenticationPrincipal SecurityUser user) {
        return ResponseEntity.ok(userService.getUserStats(user.getId()));
    }
}
