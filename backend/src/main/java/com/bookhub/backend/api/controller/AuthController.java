package com.bookhub.backend.api.controller;

import com.bookhub.backend.api.dto.auth.*;
import com.bookhub.backend.api.exception.RateLimitExceededException;
import com.bookhub.backend.api.service.AuthService;
import com.bookhub.backend.config.RateLimitService;
import com.bookhub.backend.config.SecurityUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registro, login, tokens y recuperación de contraseña")
public class AuthController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";

    @PostMapping("/register")
    @Operation(summary = "Registrar usuario", description = "Crea una nueva cuenta de usuario")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String clientIp = getClientIP(httpRequest);
        if (!rateLimitService.tryConsumeGeneral(clientIp)) {
            throw new RateLimitExceededException();
        }
        AuthResponse response = authService.register(request);
        setRefreshTokenCookie(httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica un usuario y retorna tokens JWT")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String clientIp = getClientIP(httpRequest);
        String rateLimitKey = clientIp + ":" + request.getEmail();
        
        if (!rateLimitService.tryConsumeLogin(rateLimitKey)) {
            throw new RateLimitExceededException(
                    "Demasiados intentos de inicio de sesión. Por favor, espera 15 minutos.");
        }
        
        AuthResponse response = authService.login(request);
        
        // On successful login, reset the rate limit for this key
        rateLimitService.resetLoginLimit(rateLimitKey);

        setRefreshTokenCookie(httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refrescar token", description = "Genera un nuevo access token usando el refresh token. Acepta el refresh token desde cookie httpOnly o desde el body.")
    public ResponseEntity<AuthResponse> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest request,
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String cookieRefreshToken,
            HttpServletResponse httpResponse) {
        // Prefer cookie, fallback to body for backward compatibility
        String refreshToken = cookieRefreshToken;
        if (refreshToken == null && request != null) {
            refreshToken = request.getRefreshToken();
        }
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new com.bookhub.backend.api.exception.UnauthorizedException("Refresh token no proporcionado");
        }

        RefreshTokenRequest tokenRequest = RefreshTokenRequest.builder()
                .refreshToken(refreshToken)
                .build();
        AuthResponse response = authService.refreshToken(tokenRequest);
        setRefreshTokenCookie(httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión", description = "Invalida los tokens del usuario")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal SecurityUser user,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String authHeader = httpRequest.getHeader("Authorization");
        String accessToken = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7) : null;
        authService.logout(user.getId(), accessToken);
        clearRefreshTokenCookie(httpResponse);
        return ResponseEntity.ok().build();
    }

    /**
     * Initiates password reset process.
     * Sends a password reset link to the user's email.
     * Always returns 200 OK for security (doesn't reveal if email exists).
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar reset de contraseña", description = "Envía un enlace para restablecer la contraseña")
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
        
        // In dev mode, include the reset link in the response (NEVER in production)
        if (resetLink.isPresent() && authService.isDevMode()) {
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
    @Operation(summary = "Validar token de reset", description = "Verifica si un token de reset de contraseña es válido")
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
    @Operation(summary = "Restablecer contraseña", description = "Establece una nueva contraseña usando el token de reset")
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
     * Sets the refresh token as an httpOnly cookie.
     * SameSite=Lax for CSRF protection, Secure only on HTTPS.
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, refreshToken)
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/api/auth")
                .maxAge(Duration.ofMillis(refreshExpirationMs))
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Clears the refresh token cookie.
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(false)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Get the client IP address, considering proxy headers.
     * Validates format to prevent X-Forwarded-For spoofing from polluting rate-limit keys.
     */
    private static final java.util.regex.Pattern IP_PATTERN = java.util.regex.Pattern.compile(
            "^[0-9]{1,3}(\\.[0-9]{1,3}){3}$|^[0-9a-fA-F:]+$");

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            String candidate = xfHeader.split(",")[0].trim();
            // Only use if it looks like a valid IP (max 45 chars for IPv6)
            if (candidate.length() <= 45 && IP_PATTERN.matcher(candidate).matches()) {
                return candidate;
            }
        }
        return request.getRemoteAddr();
    }
}
