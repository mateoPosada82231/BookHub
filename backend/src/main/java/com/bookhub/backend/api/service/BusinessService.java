package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.domain.business.*;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import com.bookhub.backend.domain.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final WorkerRepository workerRepository;

    /**
     * Search businesses with filters and pagination
     */
    @Transactional(readOnly = true)
    public PageResponse<BusinessSummaryResponse> searchBusinesses(
            String query,
            BusinessCategory category,
            String city,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("averageRating").descending());
        Page<Business> businesses;

        if (query != null && !query.isBlank() && category != null) {
            businesses = businessRepository.searchByNameAndCategory(query, category, pageable);
        } else if (query != null && !query.isBlank()) {
            businesses = businessRepository.searchByName(query, pageable);
        } else if (category != null) {
            businesses = businessRepository.findByCategoryAndActiveTrue(category, pageable);
        } else {
            businesses = businessRepository.findByActiveTrue(pageable);
        }

        List<BusinessSummaryResponse> content = businesses.getContent().stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());

        return PageResponse.<BusinessSummaryResponse>builder()
                .content(content)
                .totalElements(businesses.getTotalElements())
                .totalPages(businesses.getTotalPages())
                .currentPage(businesses.getNumber())
                .pageSize(businesses.getSize())
                .first(businesses.isFirst())
                .last(businesses.isLast())
                .empty(businesses.isEmpty())
                .build();
    }

    /**
     * Get business by ID with full details
     */
    @Transactional(readOnly = true)
    public BusinessResponse getBusinessById(Long id) {
        Business business = businessRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", id));

        return toFullResponse(business);
    }

    /**
     * Get businesses owned by a user
     */
    @Transactional(readOnly = true)
    public List<BusinessSummaryResponse> getMyBusinesses(Long ownerId) {
        return businessRepository.findByOwnerId(ownerId).stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create a new business
     */
    @Transactional
    public BusinessResponse createBusiness(Long ownerId, CreateBusinessRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", ownerId));

        // Verify user has OWNER role
        if (owner.getRole() != UserRole.OWNER) {
            throw new ForbiddenException("Solo los usuarios con rol OWNER pueden crear negocios");
        }

        Business business = Business.builder()
                .owner(owner)
                .name(request.getName())
                .category(request.getCategory())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .phone(request.getPhone())
                .coverImageUrl(request.getCoverImageUrl())
                .active(true)
                .build();

        business = businessRepository.save(business);

        return toFullResponse(business);
    }

    /**
     * Update business
     */
    @Transactional
    public BusinessResponse updateBusiness(Long businessId, Long userId, UpdateBusinessRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        // Verify ownership
        if (!business.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para modificar este negocio");
        }

        if (request.getName() != null) {
            business.setName(request.getName());
        }
        if (request.getCategory() != null) {
            business.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            business.setDescription(request.getDescription());
        }
        if (request.getAddress() != null) {
            business.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            business.setCity(request.getCity());
        }
        if (request.getPhone() != null) {
            business.setPhone(request.getPhone());
        }
        if (request.getCoverImageUrl() != null) {
            business.setCoverImageUrl(request.getCoverImageUrl());
        }
        if (request.getActive() != null) {
            business.setActive(request.getActive());
        }

        business = businessRepository.save(business);

        return toFullResponse(business);
    }

    /**
     * Delete business (soft delete)
     */
    @Transactional
    public void deleteBusiness(Long businessId, Long userId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        if (!business.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para eliminar este negocio");
        }

        business.setActive(false);
        businessRepository.save(business);
    }

    // ========== MAPPER METHODS ==========

    public BusinessSummaryResponse toSummaryResponse(Business business) {
        return BusinessSummaryResponse.builder()
                .id(business.getId())
                .name(business.getName())
                .category(business.getCategory())
                .categoryDisplay(business.getCategory().getDisplayName())
                .address(business.getAddress())
                .city(business.getCity())
                .coverImageUrl(business.getCoverImageUrl())
                .averageRating(business.getAverageRating())
                .totalReviews(business.getTotalReviews())
                .servicesCount(business.getServices() != null ? business.getServices().size() : 0)
                .build();
    }

    private BusinessResponse toFullResponse(Business business) {
        List<ServiceResponse> services = serviceRepository.findByBusinessIdAndActiveTrue(business.getId())
                .stream()
                .map(this::toServiceResponse)
                .collect(Collectors.toList());

        List<WorkerResponse> workers = workerRepository.findByBusinessIdWithProfile(business.getId())
                .stream()
                .map(this::toWorkerResponse)
                .collect(Collectors.toList());

        List<String> galleryImages = business.getGalleryImages() != null
                ? business.getGalleryImages().stream()
                        .map(BusinessImage::getImageUrl)
                        .collect(Collectors.toList())
                : List.of();

        return BusinessResponse.builder()
                .id(business.getId())
                .name(business.getName())
                .category(business.getCategory())
                .categoryDisplay(business.getCategory().getDisplayName())
                .description(business.getDescription())
                .address(business.getAddress())
                .city(business.getCity())
                .phone(business.getPhone())
                .coverImageUrl(business.getCoverImageUrl())
                .active(business.isActive())
                .averageRating(business.getAverageRating())
                .totalReviews(business.getTotalReviews())
                .ownerId(business.getOwner().getId())
                .ownerName(business.getOwner().getProfile() != null
                        ? business.getOwner().getProfile().getFullName()
                        : null)
                .servicesCount(services.size())
                .workersCount(workers.size())
                .createdAt(business.getCreatedAt())
                .services(services)
                .workers(workers)
                .galleryImages(galleryImages)
                .build();
    }

    private ServiceResponse toServiceResponse(com.bookhub.backend.domain.business.Service service) {
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

    private WorkerResponse toWorkerResponse(Worker worker) {
        return WorkerResponse.builder()
                .id(worker.getId())
                .userId(worker.getUser().getId())
                .fullName(worker.getUser().getProfile() != null
                        ? worker.getUser().getProfile().getFullName()
                        : null)
                .avatarUrl(worker.getUser().getProfile() != null
                        ? worker.getUser().getProfile().getAvatarUrl()
                        : null)
                .position(worker.getPosition())
                .active(worker.isActive())
                .businessId(worker.getBusiness().getId())
                .businessName(worker.getBusiness().getName())
                .createdAt(worker.getCreatedAt())
                .build();
    }
}

