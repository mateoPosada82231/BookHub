package com.bookhub.backend.api.mapper;

import com.bookhub.backend.api.dto.business.ServiceResponse;
import com.bookhub.backend.domain.business.Service;
import org.springframework.stereotype.Component;

/**
 * Centralized mapper for Service -> ServiceResponse.
 * Eliminates duplicate mapping in BusinessService and ServiceManagementService.
 */
@Component
public class ServiceMapper {

    public ServiceResponse toResponse(Service service) {
        return ServiceResponse.builder()
                .id(service.getId())
                .name(service.getName())
                .description(service.getDescription())
                .durationMinutes(service.getDurationMinutes())
                .price(service.getPrice())
                .imageUrl(service.getImageUrl())
                .active(service.isActive())
                .businessId(service.getBusiness().getId())
                .businessName(service.getBusiness().getName())
                .build();
    }
}
