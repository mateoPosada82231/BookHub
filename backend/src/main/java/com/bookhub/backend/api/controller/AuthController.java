package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.auth.*;
import com.bookhub.backend.api.exception.RateLimitExceededException;
import com.bookhub.backend.api.service.AuthService;
import com.bookhub.backend.config.RateLimitService;
import com.bookhub.backend.config.SecurityUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIP(httpRequest);
        if (!rateLimitService.tryConsumeGeneral(clientIp)) {
            throw new RateLimitExceededException();
        }
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIP(httpRequest);
        String rateLimitKey = clientIp + ":" + request.getEmail();
        
        if (!rateLimitService.tryConsumeLogin(rateLimitKey)) {
            throw new RateLimitExceededException(
                    "Demasiados intentos de inicio de sesión. Por favor, espera 15 minutos.");
        }
        
        AuthResponse response = authService.login(request);
        
        // On successful login, reset the rate limit for this key
        rateLimitService.resetLoginLimit(rateLimitKey);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal SecurityUser user) {
        authService.logout(user.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Initiates password reset process.
     * Sends a password reset link to the user's email.
     * Always returns 200 OK for security (doesn't reveal if email exists).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIP(httpRequest);
        String rateLimitKey = clientIp + ":" + request.getEmail();
        
        if (!rateLimitService.tryConsumePasswordReset(rateLimitKey)) {
            throw new RateLimitExceededException(
                    "Demasiadas solicitudes de recuperación. Por favor, espera 1 hora.");
        }
        
        var resetLink = authService.initiatePasswordReset(request.getEmail());
        
        // In dev mode, include the reset link in the response
        if (resetLink.isPresent()) {
            return ResponseEntity.ok(MessageResponse.builder()
                    .message("Modo desarrollo: usa el enlace de abajo para restablecer tu contraseña")
                    .devResetLink(resetLink.get())
                    .build());
        }
        
        return ResponseEntity.ok(new MessageResponse(
                "Si el correo está registrado, recibirás un enlace de recuperación"));
    }

    /**
     * Validates a password reset token.
     */
    @GetMapping("/validate-reset-token")
    public ResponseEntity<MessageResponse> validateResetToken(
            @RequestParam String token) {
        boolean isValid = authService.validateResetToken(token);
        if (isValid) {
            return ResponseEntity.ok(new MessageResponse("Token válido"));
        } else {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Token inválido o expirado"));
        }
    }

    /**
     * Resets the user's password using a valid reset token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIP(httpRequest);
        
        if (!rateLimitService.tryConsumeGeneral(clientIp)) {
            throw new RateLimitExceededException();
        }
        
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new MessageResponse("Contraseña actualizada correctamente"));
    }

    /**
     * Get the client IP address, considering proxy headers.
     */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
