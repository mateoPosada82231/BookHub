package com.bookhub.backend.domain.user;

import jakarta.persistence.*;
import lombok.*;

/**
 * Profile entity containing additional user information.
 * Separated from User to allow optional/extended profile data.
 */
@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    private Long id; // Same as user ID (shared primary key)

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(length = 500)
    private String bio;

    @Column(length = 20)
    private String phone;
}
