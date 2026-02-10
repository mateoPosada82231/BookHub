package com.bookhub.backend.domain.business;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessRepository extends JpaRepository<Business, Long> {

    /**
     * Find businesses by category with pagination
     */
    Page<Business> findByCategoryAndActiveTrue(BusinessCategory category, Pageable pageable);

    /**
     * Find all active businesses with pagination
     */
    Page<Business> findByActiveTrue(Pageable pageable);

    /**
     * Search businesses by name (case-insensitive)
     */
    @Query("SELECT b FROM Business b WHERE b.active = true AND LOWER(b.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Business> searchByName(@Param("query") String query, Pageable pageable);

    /**
     * Search businesses by name and category
     */
    @Query("SELECT b FROM Business b WHERE b.active = true AND b.category = :category AND LOWER(b.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Business> searchByNameAndCategory(@Param("query") String query, @Param("category") BusinessCategory category,
            Pageable pageable);

    /**
     * Find businesses by owner
     */
    List<Business> findByOwnerId(Long ownerId);

    /**
     * Find businesses by city
     */
    Page<Business> findByCityAndActiveTrue(String city, Pageable pageable);
}
