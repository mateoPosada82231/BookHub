package com.bookhub.backend.domain.business;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessRepository extends JpaRepository<Business, Long> {

    /**
     * Find businesses by category with pagination.
     * Uses EntityGraph to eagerly fetch services and avoid N+1 queries.
     */
    @EntityGraph(attributePaths = {"services"})
    Page<Business> findByCategoryAndActiveTrue(BusinessCategory category, Pageable pageable);

    /**
     * Find all active businesses with pagination.
     * Uses EntityGraph to eagerly fetch services and avoid N+1 queries.
     */
    @EntityGraph(attributePaths = {"services"})
    Page<Business> findByActiveTrue(Pageable pageable);

    /**
     * Search businesses by name (case-insensitive).
     * Uses EntityGraph to eagerly fetch services and avoid N+1 queries.
     */
    @EntityGraph(attributePaths = {"services"})
    @Query("SELECT b FROM Business b WHERE b.active = true AND LOWER(b.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Business> searchByName(@Param("query") String query, Pageable pageable);

    /**
     * Search businesses by name and category.
     * Uses EntityGraph to eagerly fetch services and avoid N+1 queries.
     */
    @EntityGraph(attributePaths = {"services"})
    @Query("SELECT b FROM Business b WHERE b.active = true AND b.category = :category AND LOWER(b.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Business> searchByNameAndCategory(@Param("query") String query, @Param("category") BusinessCategory category,
            Pageable pageable);

    /**
     * Find business by ID with all relationships eagerly loaded (for detail view).
     */
    @EntityGraph(attributePaths = {"owner", "services", "workers", "galleryImages"})
    Optional<Business> findById(Long id);

    /**
     * Find business by ID without eager loading (lightweight, for ownership checks and updates).
     */
    @Query("SELECT b FROM Business b WHERE b.id = :id")
    Optional<Business> findByIdBasic(@Param("id") Long id);

    /**
     * Find businesses by owner
     */
    @EntityGraph(attributePaths = {"services"})
    List<Business> findByOwnerId(Long ownerId);

    /**
     * Find businesses by city
     */
    @EntityGraph(attributePaths = {"services"})
    Page<Business> findByCityAndActiveTrue(String city, Pageable pageable);

    /**
     * Search businesses by name and city
     */
    @EntityGraph(attributePaths = {"services"})
    @Query("SELECT b FROM Business b WHERE b.active = true AND LOWER(b.city) = LOWER(:city) AND LOWER(b.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Business> searchByNameAndCity(@Param("query") String query, @Param("city") String city, Pageable pageable);

    /**
     * Search businesses by name, category and city
     */
    @EntityGraph(attributePaths = {"services"})
    @Query("SELECT b FROM Business b WHERE b.active = true AND b.category = :category AND LOWER(b.city) = LOWER(:city) AND LOWER(b.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Business> searchByNameAndCategoryAndCity(@Param("query") String query, @Param("category") BusinessCategory category, @Param("city") String city, Pageable pageable);

    /**
     * Find businesses by category and city
     */
    @EntityGraph(attributePaths = {"services"})
    @Query("SELECT b FROM Business b WHERE b.active = true AND b.category = :category AND LOWER(b.city) = LOWER(:city)")
    Page<Business> findByCategoryAndCityAndActiveTrue(@Param("category") BusinessCategory category, @Param("city") String city, Pageable pageable);
}
