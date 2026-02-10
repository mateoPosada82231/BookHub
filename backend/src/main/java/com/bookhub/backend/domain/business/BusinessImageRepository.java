package com.bookhub.backend.domain.business;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessImageRepository extends JpaRepository<BusinessImage, Long> {

    List<BusinessImage> findByBusinessIdOrderByDisplayOrderAsc(Long businessId);

    @Query("SELECT COALESCE(MAX(bi.displayOrder), 0) FROM BusinessImage bi WHERE bi.business.id = :businessId")
    Integer findMaxDisplayOrderByBusinessId(@Param("businessId") Long businessId);

    Optional<BusinessImage> findByIdAndBusinessId(Long id, Long businessId);
}
