package com.bookhub.backend.api.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.bookhub.backend.domain.user.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private UserRole role;
    private boolean enabled;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    private String bio;
    private String phone;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
