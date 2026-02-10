package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.AddBusinessImageRequest;
import com.bookhub.backend.api.dto.business.BusinessImageResponse;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.domain.business.Business;
import com.bookhub.backend.domain.business.BusinessImage;
import com.bookhub.backend.domain.business.BusinessImageRepository;
import com.bookhub.backend.domain.business.BusinessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusinessImageService {

    private final BusinessImageRepository businessImageRepository;
    private final BusinessRepository businessRepository;

    /**
     * Get all images for a business (public)
     */
    @Transactional(readOnly = true)
    public List<BusinessImageResponse> getBusinessImages(Long businessId) {
        return businessImageRepository.findByBusinessIdOrderByDisplayOrderAsc(businessId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Add an image to business gallery (owner only)
     */
    @Transactional
    public BusinessImageResponse addImage(Long businessId, Long userId, AddBusinessImageRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        // Verify ownership
        if (!business.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("Solo el dueño puede agregar imágenes al negocio");
        }

        // Get next display order
        Integer maxOrder = businessImageRepository.findMaxDisplayOrderByBusinessId(businessId);
        int nextOrder = (maxOrder != null ? maxOrder : 0) + 1;

        BusinessImage image = BusinessImage.builder()
                .business(business)
                .imageUrl(request.getImageUrl())
                .caption(request.getCaption())
                .displayOrder(nextOrder)
                .build();

        image = businessImageRepository.save(image);

        return toResponse(image);
    }

    /**
     * Remove an image from business gallery (owner only)
     */
    @Transactional
    public void removeImage(Long businessId, Long imageId, Long userId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        // Verify ownership
        if (!business.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("Solo el dueño puede eliminar imágenes del negocio");
        }

        BusinessImage image = businessImageRepository.findByIdAndBusinessId(imageId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Imagen", imageId));

        businessImageRepository.delete(image);
    }

    private BusinessImageResponse toResponse(BusinessImage image) {
        return BusinessImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .caption(image.getCaption())
                .displayOrder(image.getDisplayOrder())
                .build();
    }
}
