package com.bookhub.backend.domain.business;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {

    List<Worker> findByBusinessIdAndActiveTrue(Long businessId);

    List<Worker> findByUserId(Long userId);

    Optional<Worker> findByUserIdAndBusinessId(Long userId, Long businessId);

    @Query("SELECT w FROM Worker w JOIN FETCH w.user u JOIN FETCH u.profile WHERE w.business.id = :businessId AND w.active = true")
    List<Worker> findByBusinessIdWithProfile(@Param("businessId") Long businessId);
}
