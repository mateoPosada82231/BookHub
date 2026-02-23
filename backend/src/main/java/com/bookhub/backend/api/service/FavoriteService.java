package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.BusinessSummaryResponse;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.domain.business.Business;
import com.bookhub.backend.domain.business.BusinessRepository;
import com.bookhub.backend.domain.user.Favorite;
import com.bookhub.backend.domain.user.FavoriteRepository;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final BusinessService businessService;

    @Transactional(readOnly = true)
    public PageResponse<BusinessSummaryResponse> getUserFavorites(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Favorite> favorites = favoriteRepository.findByUserIdWithBusiness(userId, pageable);

        List<BusinessSummaryResponse> content = favorites.getContent().stream()
                .map(f -> businessService.toSummaryResponse(f.getBusiness()))
                .collect(Collectors.toList());

        return PageResponse.<BusinessSummaryResponse>builder()
                .content(content)
                .currentPage(favorites.getNumber())
                .pageSize(favorites.getSize())
                .totalElements(favorites.getTotalElements())
                .totalPages(favorites.getTotalPages())
                .first(favorites.isFirst())
                .last(favorites.isLast())
                .empty(favorites.isEmpty())
                .build();
    }

    @Transactional(readOnly = true)
    public List<BusinessSummaryResponse> getAllUserFavorites(Long userId) {
        List<Favorite> favorites = favoriteRepository.findByUserIdWithBusiness(userId);
        return favorites.stream()
                .map(f -> businessService.toSummaryResponse(f.getBusiness()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Set<Long> getUserFavoriteIds(Long userId) {
        return favoriteRepository.findBusinessIdsByUserId(userId)
                .stream()
                .collect(Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long businessId) {
        return favoriteRepository.existsByUserIdAndBusinessId(userId, businessId);
    }

    @Transactional
    public void addFavorite(Long userId, Long businessId) {
        if (favoriteRepository.existsByUserIdAndBusinessId(userId, businessId)) {
            return; // Already a favorite
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        
        Business business = businessRepository.findByIdBasic(businessId)
                .orElseThrow(() -> new EntityNotFoundException("Negocio no encontrado"));

        Favorite favorite = Favorite.builder()
                .user(user)
                .business(business)
                .build();

        favoriteRepository.save(favorite);
    }

    @Transactional
    public void removeFavorite(Long userId, Long businessId) {
        favoriteRepository.deleteByUserIdAndBusinessId(userId, businessId);
    }

    @Transactional
    public boolean toggleFavorite(Long userId, Long businessId) {
        if (favoriteRepository.existsByUserIdAndBusinessId(userId, businessId)) {
            favoriteRepository.deleteByUserIdAndBusinessId(userId, businessId);
            return false; // Removed
        } else {
            addFavorite(userId, businessId);
            return true; // Added
        }
    }

    @Transactional(readOnly = true)
    public long countUserFavorites(Long userId) {
        return favoriteRepository.countByUserId(userId);
    }
}
