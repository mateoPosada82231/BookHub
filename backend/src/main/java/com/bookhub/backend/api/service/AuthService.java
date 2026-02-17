package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.auth.AuthResponse;
import com.bookhub.backend.api.dto.auth.LoginRequest;
import com.bookhub.backend.api.dto.auth.RefreshTokenRequest;
import com.bookhub.backend.api.dto.auth.RegisterRequest;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.api.exception.UnauthorizedException;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.config.JwtService;
import com.bookhub.backend.config.SecurityUser;
import com.bookhub.backend.domain.user.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final InputSanitizer sanitizer;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${app.password-reset.expiration-minutes:60}")
    private int passwordResetExpirationMinutes;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.dev-mode:true}")
    private boolean devMode;

    /**
     * Returns whether the application is running in development mode.
     * Used to control exposure of sensitive debug information.
     */
    public boolean isDevMode() {
        return devMode;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El email ya está registrado");
        }

        // Create User
        var user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)
                .build();

        // Create Profile
        var profile = Profile.builder()
                .user(user)
                .fullName(sanitizer.sanitize(request.getFullName()))
                .phone(sanitizer.sanitize(request.getPhone()))
                .build();

        user.setProfile(profile);

        // Save
        userRepository.save(user);

        // Generate Tokens
        var userDetails = new SecurityUser(user);
        var accessToken = jwtService.generateToken(userDetails);
        var refreshToken = jwtService.generateRefreshToken(userDetails);

        // Save refresh token
        saveRefreshToken(user, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getProfile().getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));

        // Delete old refresh tokens for this user
        refreshTokenRepository.deleteByUserId(user.getId());

        var userDetails = new SecurityUser(user);
        var accessToken = jwtService.generateToken(userDetails);
        var refreshToken = jwtService.generateRefreshToken(userDetails);

        // Save new refresh token
        saveRefreshToken(user, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getProfile().getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Refresh token inválido"));

        // Check if token is expired
        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new UnauthorizedException("Refresh token expirado");
        }

        User user = storedToken.getUser();
        var userDetails = new SecurityUser(user);

        // Generate new tokens
        var newAccessToken = jwtService.generateToken(userDetails);
        var newRefreshToken = jwtService.generateRefreshToken(userDetails);

        // Delete old and save new refresh token
        refreshTokenRepository.delete(storedToken);
        saveRefreshToken(user, newRefreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getProfile() != null ? user.getProfile().getFullName() : null)
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    /**
     * Initiates password reset process by generating a token and sending an email.
     * For security, always returns success even if email doesn't exist.
     * In dev mode, returns the reset link directly.
     * 
     * @return Optional containing the reset link in dev mode, empty in production
     */
    @Transactional
    public Optional<String> initiatePasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            // Silent fail if user not found (security best practice)
            return Optional.empty();
        }
        
        User user = userOpt.get();
        
        // Delete any existing reset tokens for this user
        passwordResetTokenRepository.deleteByUserId(user.getId());

        // Generate a new reset token
        String token = UUID.randomUUID().toString();
        
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusMinutes(passwordResetExpirationMinutes))
                .build();
        
        passwordResetTokenRepository.save(resetToken);

        String resetLink = frontendUrl + "/reset-password?token=" + token;

        // Send password reset email
        String userName = user.getProfile() != null ? user.getProfile().getFullName() : null;
        emailService.sendPasswordResetEmail(user.getEmail(), token, userName);
        
        log.info("Password reset initiated for user: {}", user.getEmail());
        
        // In dev mode, return the reset link
        if (devMode) {
            log.info("DEV MODE - Reset link: {}", resetLink);
            return Optional.of(resetLink);
        }
        
        return Optional.empty();
    }

    /**
     * Validates a password reset token.
     */
    @Transactional(readOnly = true)
    public boolean validateResetToken(String token) {
        return passwordResetTokenRepository.findByTokenAndUsedFalse(token)
                .map(PasswordResetToken::isValid)
                .orElse(false);
    }

    /**
     * Resets the user's password using a valid reset token.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new BadRequestException("Token de recuperación inválido o expirado"));

        if (!resetToken.isValid()) {
            throw new BadRequestException("Token de recuperación inválido o expirado");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Invalidate all refresh tokens (force re-login)
        refreshTokenRepository.deleteByUserId(user.getId());

        log.info("Password reset completed for user: {}", user.getEmail());
    }

    private void saveRefreshToken(User user, String token) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);
    }
}
