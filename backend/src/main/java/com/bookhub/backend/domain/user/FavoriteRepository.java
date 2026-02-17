package com.bookhub.backend.domain.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    @Query("SELECT f FROM Favorite f JOIN FETCH f.business b LEFT JOIN FETCH b.services WHERE f.user.id = :userId ORDER BY f.createdAt DESC")
    List<Favorite> findByUserIdWithBusiness(@Param("userId") Long userId);

    @Query("SELECT f FROM Favorite f JOIN FETCH f.business b LEFT JOIN FETCH b.services WHERE f.user.id = :userId ORDER BY f.createdAt DESC")
    Page<Favorite> findByUserIdWithBusiness(@Param("userId") Long userId, Pageable pageable);

    Optional<Favorite> findByUserIdAndBusinessId(Long userId, Long businessId);

    boolean existsByUserIdAndBusinessId(Long userId, Long businessId);

    void deleteByUserIdAndBusinessId(Long userId, Long businessId);

    @Query("SELECT f.business.id FROM Favorite f WHERE f.user.id = :userId")
    List<Long> findBusinessIdsByUserId(@Param("userId") Long userId);

    long countByUserId(Long userId);
}
