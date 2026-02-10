package com.bookhub.backend.domain.business;

import jakarta.persistence.*;
import lombok.*;

/**
 * Business gallery image entity.
 * Stores multiple images for each business.
 */
@Entity
@Table(name = "business_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "caption", length = 255)
    private String caption;

    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;
}
