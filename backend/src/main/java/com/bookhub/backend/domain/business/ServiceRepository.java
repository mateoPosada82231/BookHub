package com.bookhub.backend.domain.business;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    List<Service> findByBusinessIdAndActiveTrue(Long businessId);

    List<Service> findByBusinessId(Long businessId);
}
