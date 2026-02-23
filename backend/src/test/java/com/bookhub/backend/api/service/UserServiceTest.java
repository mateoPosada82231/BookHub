package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.user.*;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.domain.booking.AppointmentRepository;
import com.bookhub.backend.domain.booking.ReviewRepository;
import com.bookhub.backend.domain.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private InputSanitizer sanitizer;

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Profile testProfile;

    @BeforeEach
    void setUp() {
        testProfile = Profile.builder()
                .fullName("Juan Pérez")
                .phone("3001234567")
                .bio("Test bio")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        testUser = User.builder()
                .id(1L)
                .email("juan@test.com")
                .passwordHash("hashedPassword")
                .role(UserRole.CLIENT)
                .enabled(true)
                .profile(testProfile)
                .build();

        testProfile.setUser(testUser);

        lenient().when(sanitizer.sanitize(anyString())).thenAnswer(i -> i.getArgument(0));
    }

    // ===== getUserById =====

    @Test
    @DisplayName("getUserById debe retornar el usuario cuando existe")
    void getUserById_shouldReturnUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserResponse response = userService.getUserById(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("juan@test.com");
        assertThat(response.getFullName()).isEqualTo("Juan Pérez");
        assertThat(response.getRole()).isEqualTo(UserRole.CLIENT);
    }

    @Test
    @DisplayName("getUserById debe lanzar excepción si usuario no existe")
    void getUserById_shouldThrowWhenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Usuario");
    }

    @Test
    @DisplayName("getUserById debe manejar usuario sin perfil")
    void getUserById_shouldHandleNullProfile() {
        User userWithoutProfile = User.builder()
                .id(2L)
                .email("sinperfil@test.com")
                .role(UserRole.CLIENT)
                .enabled(true)
                .build();
        when(userRepository.findById(2L)).thenReturn(Optional.of(userWithoutProfile));

        UserResponse response = userService.getUserById(2L);

        assertThat(response.getId()).isEqualTo(2L);
        assertThat(response.getFullName()).isNull();
    }

    // ===== updateProfile =====

    @Test
    @DisplayName("updateProfile debe actualizar campos del perfil existente")
    void updateProfile_shouldUpdateExistingProfile() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Juan Actualizado")
                .bio("Nueva bio")
                .build();

        UserResponse response = userService.updateProfile(1L, request);

        assertThat(response).isNotNull();
        verify(userRepository).save(any(User.class));
        verify(sanitizer, atLeastOnce()).sanitize(anyString());
    }

    @Test
    @DisplayName("updateProfile debe crear perfil si no existe")
    void updateProfile_shouldCreateProfileIfNull() {
        User userNoProfile = User.builder()
                .id(3L)
                .email("noprofile@test.com")
                .role(UserRole.CLIENT)
                .enabled(true)
                .build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(userNoProfile));
        when(userRepository.save(any(User.class))).thenReturn(userNoProfile);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Nuevo nombre")
                .build();

        userService.updateProfile(3L, request);

        verify(userRepository).save(argThat(user -> user.getProfile() != null));
    }

    // ===== changePassword =====

    @Test
    @DisplayName("changePassword debe cambiar la contraseña cuando la actual es correcta")
    void changePassword_shouldChangeWhenCurrentIsCorrect() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("currentPass", "hashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword")).thenReturn("newHashedPassword");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("currentPass")
                .newPassword("newPassword")
                .build();

        userService.changePassword(1L, request);

        verify(userRepository).save(argThat(user ->
                user.getPasswordHash().equals("newHashedPassword")
        ));
    }

    @Test
    @DisplayName("changePassword debe lanzar excepción si la contraseña actual es incorrecta")
    void changePassword_shouldThrowWhenCurrentIsWrong() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPass", "hashedPassword")).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrongPass")
                .newPassword("newPassword")
                .build();

        assertThatThrownBy(() -> userService.changePassword(1L, request))
                .isInstanceOf(BadRequestException.class);
    }

    // ===== findByEmail =====

    @Test
    @DisplayName("findByEmail debe retornar el usuario cuando existe")
    void findByEmail_shouldReturnUser() {
        when(userRepository.findByEmail("juan@test.com")).thenReturn(Optional.of(testUser));

        UserResponse response = userService.findByEmail("juan@test.com");

        assertThat(response.getEmail()).isEqualTo("juan@test.com");
    }

    @Test
    @DisplayName("findByEmail debe lanzar excepción si no existe")
    void findByEmail_shouldThrowWhenNotFound() {
        when(userRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByEmail("noexiste@test.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ===== getUserStats =====

    @Test
    @DisplayName("getUserStats debe retornar todas las estadísticas")
    void getUserStats_shouldReturnAllStats() {
        when(appointmentRepository.countByClientId(1L)).thenReturn(15L);
        when(favoriteRepository.countByUserId(1L)).thenReturn(5L);
        when(reviewRepository.countByUserId(1L)).thenReturn(8L);

        UserStatsResponse stats = userService.getUserStats(1L);

        assertThat(stats.getTotalAppointments()).isEqualTo(15L);
        assertThat(stats.getTotalFavorites()).isEqualTo(5L);
        assertThat(stats.getTotalReviews()).isEqualTo(8L);
    }

    @Test
    @DisplayName("getUserStats debe retornar ceros cuando no hay datos")
    void getUserStats_shouldReturnZerosWhenEmpty() {
        when(appointmentRepository.countByClientId(1L)).thenReturn(0L);
        when(favoriteRepository.countByUserId(1L)).thenReturn(0L);
        when(reviewRepository.countByUserId(1L)).thenReturn(0L);

        UserStatsResponse stats = userService.getUserStats(1L);

        assertThat(stats.getTotalAppointments()).isEqualTo(0L);
        assertThat(stats.getTotalFavorites()).isEqualTo(0L);
        assertThat(stats.getTotalReviews()).isEqualTo(0L);
    }
}
