package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.auth.AuthResponse;
import com.bookhub.backend.api.dto.auth.LoginRequest;
import com.bookhub.backend.api.dto.auth.RegisterRequest;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.config.JwtService;
import com.bookhub.backend.config.SecurityUser;
import com.bookhub.backend.config.TokenBlacklistService;
import com.bookhub.backend.domain.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private EmailService emailService;

    @Mock
    private InputSanitizer sanitizer;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Profile testProfile;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 604800000L);
        ReflectionTestUtils.setField(authService, "passwordResetExpirationMinutes", 60);

        // Default sanitizer behavior: return the same input
        lenient().when(sanitizer.sanitize(anyString())).thenAnswer(i -> i.getArgument(0));
        lenient().when(sanitizer.sanitizeUrl(anyString())).thenAnswer(i -> i.getArgument(0));

        testProfile = Profile.builder()
                .fullName("Test User")
                .phone("123456789")
                .build();

        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .passwordHash("hashedPassword")
                .role(UserRole.CLIENT)
                .enabled(true)
                .build();
        testUser.setProfile(testProfile);
        testProfile.setUser(testUser);
    }

    @Test
    @DisplayName("Should register new user successfully")
    void register_shouldCreateNewUser() {
        // Given
        RegisterRequest request = RegisterRequest.builder()
                .email("newuser@example.com")
                .password("password123")
                .fullName("New User")
                .phone("987654321")
                .role(UserRole.CLIENT)
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId(1L);
            return savedUser;
        });
        when(jwtService.generateToken(any(SecurityUser.class))).thenReturn("accessToken");
        when(jwtService.generateRefreshToken(any(SecurityUser.class))).thenReturn("refreshToken");

        // When
        AuthResponse response = authService.register(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("accessToken");
        assertThat(response.getRefreshToken()).isEqualTo("refreshToken");
        assertThat(response.getEmail()).isEqualTo("newuser@example.com");
        assertThat(response.getFullName()).isEqualTo("New User");
        assertThat(response.getRole()).isEqualTo(UserRole.CLIENT);

        verify(userRepository).save(any(User.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void register_shouldThrowWhenEmailExists() {
        // Given
        RegisterRequest request = RegisterRequest.builder()
                .email("existing@example.com")
                .password("password123")
                .fullName("Existing User")
                .role(UserRole.CLIENT)
                .build();

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // When/Then
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("El email ya está registrado");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void login_shouldSucceedWithValidCredentials() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(any(SecurityUser.class))).thenReturn("accessToken");
        when(jwtService.generateRefreshToken(any(SecurityUser.class))).thenReturn("refreshToken");

        // When
        AuthResponse response = authService.login(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("accessToken");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getUserId()).isEqualTo(1L);

        verify(refreshTokenRepository).deleteByUserId(1L);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should throw exception with invalid credentials")
    void login_shouldThrowWithInvalidCredentials() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("wrongPassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // When/Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    @DisplayName("Should initiate password reset for existing user")
    void initiatePasswordReset_shouldSendEmailForExistingUser() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        authService.initiatePasswordReset("test@example.com");

        // Then
        verify(passwordResetTokenRepository).deleteByUserId(1L);
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq("test@example.com"), anyString(), eq("Test User"));
    }

    @Test
    @DisplayName("Should silently fail for non-existing user (security)")
    void initiatePasswordReset_shouldNotRevealNonExistingUser() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        authService.initiatePasswordReset("nonexistent@example.com");

        // Then - No exception thrown and no email sent
        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should reset password with valid token")
    void resetPassword_shouldSucceedWithValidToken() {
        // Given
        String token = "valid-reset-token";
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(1L)
                .user(testUser)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();

        when(passwordResetTokenRepository.findByTokenAndUsedFalse(token))
                .thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("newPassword123")).thenReturn("hashedNewPassword");

        // When
        authService.resetPassword(token, "newPassword123");

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo("hashedNewPassword");

        assertThat(resetToken.isUsed()).isTrue();
        verify(passwordResetTokenRepository).save(resetToken);
        verify(refreshTokenRepository).deleteByUserId(1L);
    }

    @Test
    @DisplayName("Should throw exception for invalid reset token")
    void resetPassword_shouldThrowForInvalidToken() {
        // Given
        when(passwordResetTokenRepository.findByTokenAndUsedFalse("invalid-token"))
                .thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> authService.resetPassword("invalid-token", "newPassword"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Token de recuperación inválido o expirado");
    }

    @Test
    @DisplayName("Should throw exception for expired reset token")
    void resetPassword_shouldThrowForExpiredToken() {
        // Given
        String token = "expired-token";
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .id(1L)
                .user(testUser)
                .token(token)
                .expiresAt(LocalDateTime.now().minusHours(1)) // Expired
                .used(false)
                .build();

        when(passwordResetTokenRepository.findByTokenAndUsedFalse(token))
                .thenReturn(Optional.of(expiredToken));

        // When/Then
        assertThatThrownBy(() -> authService.resetPassword(token, "newPassword"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Token de recuperación inválido o expirado");
    }

    @Test
    @DisplayName("Should validate valid reset token")
    void validateResetToken_shouldReturnTrueForValidToken() {
        // Given
        PasswordResetToken validToken = PasswordResetToken.builder()
                .token("valid-token")
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();

        when(passwordResetTokenRepository.findByTokenAndUsedFalse("valid-token"))
                .thenReturn(Optional.of(validToken));

        // When
        boolean result = authService.validateResetToken("valid-token");

        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false for invalid reset token")
    void validateResetToken_shouldReturnFalseForInvalidToken() {
        // Given
        when(passwordResetTokenRepository.findByTokenAndUsedFalse("invalid-token"))
                .thenReturn(Optional.empty());

        // When
        boolean result = authService.validateResetToken("invalid-token");

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should logout user by deleting refresh tokens and blacklisting access token")
    void logout_shouldDeleteRefreshTokensAndBlacklistAccessToken() {
        // Given
        String accessToken = "some.jwt.token";

        // When
        authService.logout(1L, accessToken);

        // Then
        verify(refreshTokenRepository).deleteByUserId(1L);
        verify(tokenBlacklistService).blacklist(accessToken);
    }

    @Test
    @DisplayName("Should logout user without access token")
    void logout_shouldHandleNullAccessToken() {
        // When
        authService.logout(1L, null);

        // Then
        verify(refreshTokenRepository).deleteByUserId(1L);
        verify(tokenBlacklistService, never()).blacklist(any());
    }
}
