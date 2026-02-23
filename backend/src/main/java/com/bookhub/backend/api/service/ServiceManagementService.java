package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.api.mapper.ServiceMapper;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.domain.business.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceManagementService {

    private final ServiceRepository serviceRepository;
    private final BusinessRepository businessRepository;
    private final InputSanitizer sanitizer;
    private final ServiceMapper serviceMapper;

    /**
     * Get all services for a business
     */
    @Transactional(readOnly = true)
    public List<ServiceResponse> getServicesByBusiness(Long businessId) {
        return serviceRepository.findByBusinessIdAndActiveTrue(businessId)
                .stream()
                .map(serviceMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get service by ID
     */
    @Transactional(readOnly = true)
    public ServiceResponse getServiceById(Long id) {
        com.bookhub.backend.domain.business.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio", id));
        return serviceMapper.toResponse(service);
    }

    /**
     * Create a new service for a business
     */
    @CacheEvict(value = "business-detail", key = "#businessId")
    @Transactional
    public ServiceResponse createService(Long businessId, Long userId, CreateServiceRequest request) {
        Business business = businessRepository.findByIdBasic(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        // Verify ownership
        if (!business.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para agregar servicios a este negocio");
        }

        com.bookhub.backend.domain.business.Service service = com.bookhub.backend.domain.business.Service.builder()
                .business(business)
                .name(sanitizer.sanitize(request.getName()))
                .description(sanitizer.sanitize(request.getDescription()))
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .imageUrl(sanitizer.sanitizeUrl(request.getImageUrl()))
                .active(true)
                .build();

        service = serviceRepository.save(service);

        return serviceMapper.toResponse(service);
    }

    /**
     * Update a service
     */
    @CacheEvict(value = "business-detail", allEntries = true)
    @Transactional
    public ServiceResponse updateService(Long serviceId, Long userId, UpdateServiceRequest request) {
        com.bookhub.backend.domain.business.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio", serviceId));

        // Verify ownership
        if (!service.getBusiness().getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para modificar este servicio");
        }

        if (request.getName() != null) {
            service.setName(sanitizer.sanitize(request.getName()));
        }
        if (request.getDescription() != null) {
            service.setDescription(sanitizer.sanitize(request.getDescription()));
        }
        if (request.getDurationMinutes() != null) {
            service.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getPrice() != null) {
            service.setPrice(request.getPrice());
        }
        if (request.getImageUrl() != null) {
            service.setImageUrl(sanitizer.sanitizeUrl(request.getImageUrl()));
        }
        if (request.getActive() != null) {
            service.setActive(request.getActive());
        }

        service = serviceRepository.save(service);

        return serviceMapper.toResponse(service);
    }

    /**
     * Delete service (soft delete)
     */
    @CacheEvict(value = "business-detail", allEntries = true)
    @Transactional
    public void deleteService(Long serviceId, Long userId) {
        com.bookhub.backend.domain.business.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio", serviceId));

        if (!service.getBusiness().getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para eliminar este servicio");
        }

        service.setActive(false);
        serviceRepository.save(service);
    }
}

