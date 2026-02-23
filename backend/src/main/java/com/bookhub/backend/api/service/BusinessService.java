package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.api.mapper.ServiceMapper;
import com.bookhub.backend.api.mapper.WorkerMapper;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.domain.business.*;
import com.bookhub.backend.domain.booking.AppointmentRepository;
import com.bookhub.backend.domain.booking.StatusCountProjection;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import com.bookhub.backend.domain.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusinessService {

    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final WorkerRepository workerRepository;
    private final AppointmentRepository appointmentRepository;
    private final InputSanitizer sanitizer;
    private final ServiceMapper serviceMapper;
    private final WorkerMapper workerMapper;

    /**
     * Search businesses with filters and pagination
     */
    @Transactional(readOnly = true)
    public PageResponse<BusinessSummaryResponse> searchBusinesses(
            String query,
            BusinessCategory category,
            String city,
            String sortBy,
            Double minRating,
            int page,
            int size) {

        // Limit page size to prevent abuse
        int safeSize = Math.min(size, 50);

        Sort sort = resolveSort(sortBy);
        Pageable pageable = PageRequest.of(page, safeSize, sort);
        Page<Business> businesses;

        if (city != null && !city.isBlank()) {
            // City filter using existing repository method
            if (query != null && !query.isBlank() && category != null) {
                businesses = businessRepository.searchByNameAndCategoryAndCity(query, category, city, pageable);
            } else if (query != null && !query.isBlank()) {
                businesses = businessRepository.searchByNameAndCity(query, city, pageable);
            } else if (category != null) {
                businesses = businessRepository.findByCategoryAndCityAndActiveTrue(category, city, pageable);
            } else {
                businesses = businessRepository.findByCityAndActiveTrue(city, pageable);
            }
        } else if (query != null && !query.isBlank() && category != null) {
            businesses = businessRepository.searchByNameAndCategory(query, category, pageable);
        } else if (query != null && !query.isBlank()) {
            businesses = businessRepository.searchByName(query, pageable);
        } else if (category != null) {
            businesses = businessRepository.findByCategoryAndActiveTrue(category, pageable);
        } else {
            businesses = businessRepository.findByActiveTrue(pageable);
        }

        // Filter by minRating in-memory (safe null check to prevent NPE)
        List<BusinessSummaryResponse> content = businesses.getContent().stream()
                .filter(b -> minRating == null
                        || (b.getAverageRating() != null && b.getAverageRating().doubleValue() >= minRating))
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());

        // Adjust totalElements if minRating filter was applied (post-pagination filtering)
        long totalElements = minRating != null ? content.size() : businesses.getTotalElements();
        int totalPages = minRating != null
                ? (int) Math.ceil((double) totalElements / safeSize)
                : businesses.getTotalPages();

        return PageResponse.<BusinessSummaryResponse>builder()
                .content(content)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .currentPage(businesses.getNumber())
                .pageSize(businesses.getSize())
                .first(businesses.isFirst())
                .last(businesses.isLast())
                .empty(content.isEmpty())
                .build();
    }

    /**
     * Resolve sort order from string parameter
     */
    private Sort resolveSort(String sortBy) {
        if (sortBy == null) {
            return Sort.by("averageRating").descending();
        }
        return switch (sortBy.toLowerCase()) {
            case "name" -> Sort.by("name").ascending();
            case "newest" -> Sort.by("createdAt").descending();
            default -> Sort.by("averageRating").descending();
        };
    }

    /**
     * Get business by ID with full details
     */
    @Cacheable(value = "business-detail", key = "#id")
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
                .name(sanitizer.sanitize(request.getName()))
                .category(request.getCategory())
                .description(sanitizer.sanitize(request.getDescription()))
                .address(sanitizer.sanitize(request.getAddress()))
                .city(sanitizer.sanitize(request.getCity()))
                .phone(sanitizer.sanitize(request.getPhone()))
                .coverImageUrl(sanitizer.sanitizeUrl(request.getCoverImageUrl()))
                .active(true)
                .build();

        business = businessRepository.save(business);

        return toFullResponse(business);
    }

    /**
     * Update business
     */
    @CacheEvict(value = "business-detail", key = "#businessId")
    @Transactional
    public BusinessResponse updateBusiness(Long businessId, Long userId, UpdateBusinessRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        // Verify ownership
        if (!business.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para modificar este negocio");
        }

        if (request.getName() != null) {
            business.setName(sanitizer.sanitize(request.getName()));
        }
        if (request.getCategory() != null) {
            business.setCategory(request.getCategory());
        }
        if (request.getDescription() != null) {
            business.setDescription(sanitizer.sanitize(request.getDescription()));
        }
        if (request.getAddress() != null) {
            business.setAddress(sanitizer.sanitize(request.getAddress()));
        }
        if (request.getCity() != null) {
            business.setCity(sanitizer.sanitize(request.getCity()));
        }
        if (request.getPhone() != null) {
            business.setPhone(sanitizer.sanitize(request.getPhone()));
        }
        if (request.getCoverImageUrl() != null) {
            business.setCoverImageUrl(sanitizer.sanitizeUrl(request.getCoverImageUrl()));
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
    @CacheEvict(value = "business-detail", key = "#businessId")
    @Transactional
    public void deleteBusiness(Long businessId, Long userId) {
        Business business = businessRepository.findByIdBasic(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        if (!business.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("No tienes permiso para eliminar este negocio");
        }

        business.setActive(false);
        businessRepository.save(business);
    }

    /**
     * Get statistics for a business (appointments, revenue, reviews)
     */
    @Transactional(readOnly = true)
    public BusinessStatsResponse getBusinessStats(Long businessId, Long ownerId) {
        Business business = businessRepository.findByIdBasic(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        if (!business.getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("No tienes permiso para ver las estadísticas de este negocio");
        }

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

        LocalDateTime startOfWeek = today.with(java.time.DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime endOfWeek = startOfWeek.plusDays(7);

        LocalDateTime startOfMonth = today.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
        LocalDateTime endOfMonth = today.with(TemporalAdjusters.firstDayOfNextMonth()).atStartOfDay();

        long appointmentsToday = appointmentRepository.countByBusinessAndDateRange(businessId, startOfDay, endOfDay);
        long appointmentsThisWeek = appointmentRepository.countByBusinessAndDateRange(businessId, startOfWeek, endOfWeek);
        long appointmentsThisMonth = appointmentRepository.countByBusinessAndDateRange(businessId, startOfMonth, endOfMonth);

        BigDecimal revenueThisWeek = appointmentRepository.sumRevenueByBusinessAndDateRange(businessId, startOfWeek, endOfWeek);
        BigDecimal revenueThisMonth = appointmentRepository.sumRevenueByBusinessAndDateRange(businessId, startOfMonth, endOfMonth);

        // Status counts
        Map<String, Long> statusCounts = new HashMap<>();
        for (StatusCountProjection row : appointmentRepository.countByStatusForBusiness(businessId)) {
            statusCounts.put(row.getStatus(), row.getCount());
        }

        return BusinessStatsResponse.builder()
                .appointmentsToday(appointmentsToday)
                .appointmentsThisWeek(appointmentsThisWeek)
                .appointmentsThisMonth(appointmentsThisMonth)
                .revenueThisWeek(revenueThisWeek)
                .revenueThisMonth(revenueThisMonth)
                .totalReviews(business.getTotalReviews())
                .averageRating(business.getAverageRating())
                .statusCounts(statusCounts)
                .build();
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
        // Use already-loaded data from @EntityGraph instead of extra queries
        List<ServiceResponse> services = business.getServices() != null
                ? business.getServices().stream()
                        .filter(com.bookhub.backend.domain.business.Service::isActive)
                        .map(serviceMapper::toResponse)
                        .collect(Collectors.toList())
                : List.of();

        // Workers loaded via @EntityGraph may not have profiles fetched,
        // so use the dedicated query only when workers aren't already initialized with profiles
        List<WorkerResponse> workers;
        if (business.getWorkers() != null && !business.getWorkers().isEmpty()) {
            workers = workerRepository.findByBusinessIdWithProfile(business.getId())
                    .stream()
                    .map(workerMapper::toResponse)
                    .collect(Collectors.toList());
        } else {
            workers = List.of();
        }

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


}

