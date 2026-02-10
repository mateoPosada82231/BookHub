package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.domain.business.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceManagementService {

    private final ServiceRepository serviceRepository;
    private final BusinessRepository businessRepository;

    /**
     * Get all services for a business
     */
    @Transactional(readOnly = true)
    public List<ServiceResponse> getServicesByBusiness(Long businessId) {
        return serviceRepository.findByBusinessIdAndActiveTrue(businessId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get service by ID
     */
    @Transactional(readOnly = true)
    public ServiceResponse getServiceById(Long id) {
        com.bookhub.backend.domain.business.Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio", id));
        return toResponse(service);
    }

    /**
     * Create a new service for a business
     */
    @Transactional
    public ServiceResponse createService(Long businessId, Long userId, CreateServiceRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        // Verify ownership
        if (!business.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para agregar servicios a este negocio");
        }

        com.bookhub.backend.domain.business.Service service = com.bookhub.backend.domain.business.Service.builder()
                .business(business)
                .name(request.getName())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .active(true)
                .build();

        service = serviceRepository.save(service);

        return toResponse(service);
    }

    /**
     * Update a service
     */
    @Transactional
    public ServiceResponse updateService(Long serviceId, Long userId, UpdateServiceRequest request) {
        com.bookhub.backend.domain.business.Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Servicio", serviceId));

        // Verify ownership
        if (!service.getBusiness().getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para modificar este servicio");
        }

        if (request.getName() != null) {
            service.setName(request.getName());
        }
        if (request.getDescription() != null) {
            service.setDescription(request.getDescription());
        }
        if (request.getDurationMinutes() != null) {
            service.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getPrice() != null) {
            service.setPrice(request.getPrice());
        }
        if (request.getImageUrl() != null) {
            service.setImageUrl(request.getImageUrl());
        }
        if (request.getActive() != null) {
            service.setActive(request.getActive());
        }

        service = serviceRepository.save(service);

        return toResponse(service);
    }

    /**
     * Delete service (soft delete)
     */
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

    private ServiceResponse toResponse(com.bookhub.backend.domain.business.Service service) {
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

