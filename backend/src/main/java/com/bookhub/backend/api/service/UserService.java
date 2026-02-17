package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.user.*;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.domain.user.Profile;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final InputSanitizer sanitizer;

    /**
     * Get user profile by ID
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
        return toResponse(user);
    }

    /**
     * Get current user profile
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        return getUserById(userId);
    }

    /**
     * Update user profile
     */
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", userId));

        Profile profile = user.getProfile();
        if (profile == null) {
            profile = Profile.builder()
                    .user(user)
                    .fullName(request.getFullName())
                    .build();
            user.setProfile(profile);
        }

        if (request.getFullName() != null) {
            profile.setFullName(sanitizer.sanitize(request.getFullName()));
        }
        if (request.getBio() != null) {
            profile.setBio(sanitizer.sanitize(request.getBio()));
        }
        if (request.getPhone() != null) {
            profile.setPhone(sanitizer.sanitize(request.getPhone()));
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(sanitizer.sanitizeUrl(request.getAvatarUrl()));
        }

        userRepository.save(user);

        return toResponse(user);
    }

    /**
     * Change user password
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", userId));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("La contraseña actual es incorrecta");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Search users by email (for adding workers)
     */
    @Transactional(readOnly = true)
    public UserResponse findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario con email " + email + " no encontrado"));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .fullName(user.getProfile() != null ? user.getProfile().getFullName() : null)
                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                .bio(user.getProfile() != null ? user.getProfile().getBio() : null)
                .phone(user.getProfile() != null ? user.getProfile().getPhone() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}

