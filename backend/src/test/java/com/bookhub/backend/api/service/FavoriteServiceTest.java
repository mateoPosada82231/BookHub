package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.BusinessSummaryResponse;
import com.bookhub.backend.domain.business.Business;
import com.bookhub.backend.domain.business.BusinessCategory;
import com.bookhub.backend.domain.business.BusinessRepository;
import com.bookhub.backend.domain.user.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private BusinessService businessService;

    @InjectMocks
    private FavoriteService favoriteService;

    private User testUser;
    private Business testBusiness;
    private Favorite testFavorite;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("user@test.com")
                .role(UserRole.CLIENT)
                .enabled(true)
                .build();

        testBusiness = Business.builder()
                .id(10L)
                .name("Test Barbería")
                .category(BusinessCategory.BARBERSHOP)
                .build();

        testFavorite = Favorite.builder()
                .id(100L)
                .user(testUser)
                .business(testBusiness)
                .build();
    }

    // ===== isFavorite =====

    @Test
    @DisplayName("isFavorite debe retornar true cuando existe")
    void isFavorite_shouldReturnTrueWhenExists() {
        when(favoriteRepository.existsByUserIdAndBusinessId(1L, 10L)).thenReturn(true);

        assertThat(favoriteService.isFavorite(1L, 10L)).isTrue();
    }

    @Test
    @DisplayName("isFavorite debe retornar false cuando no existe")
    void isFavorite_shouldReturnFalseWhenNotExists() {
        when(favoriteRepository.existsByUserIdAndBusinessId(1L, 99L)).thenReturn(false);

        assertThat(favoriteService.isFavorite(1L, 99L)).isFalse();
    }

    // ===== addFavorite =====

    @Test
    @DisplayName("addFavorite debe agregar favorito cuando no existe")
    void addFavorite_shouldAddWhenNotExists() {
        when(favoriteRepository.existsByUserIdAndBusinessId(1L, 10L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(businessRepository.findByIdBasic(10L)).thenReturn(Optional.of(testBusiness));

        favoriteService.addFavorite(1L, 10L);

        verify(favoriteRepository).save(any(Favorite.class));
    }

    @Test
    @DisplayName("addFavorite no debe duplicar si ya existe")
    void addFavorite_shouldNotDuplicateWhenAlreadyExists() {
        when(favoriteRepository.existsByUserIdAndBusinessId(1L, 10L)).thenReturn(true);

        favoriteService.addFavorite(1L, 10L);

        verify(favoriteRepository, never()).save(any());
    }

    @Test
    @DisplayName("addFavorite debe lanzar excepción si usuario no existe")
    void addFavorite_shouldThrowWhenUserNotFound() {
        when(favoriteRepository.existsByUserIdAndBusinessId(99L, 10L)).thenReturn(false);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.addFavorite(99L, 10L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Usuario");
    }

    @Test
    @DisplayName("addFavorite debe lanzar excepción si negocio no existe")
    void addFavorite_shouldThrowWhenBusinessNotFound() {
        when(favoriteRepository.existsByUserIdAndBusinessId(1L, 99L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(businessRepository.findByIdBasic(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.addFavorite(1L, 99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Negocio");
    }

    // ===== removeFavorite =====

    @Test
    @DisplayName("removeFavorite debe eliminar el favorito")
    void removeFavorite_shouldDelete() {
        favoriteService.removeFavorite(1L, 10L);

        verify(favoriteRepository).deleteByUserIdAndBusinessId(1L, 10L);
    }

    // ===== toggleFavorite =====

    @Test
    @DisplayName("toggleFavorite debe eliminar si ya existe y retornar false")
    void toggleFavorite_shouldRemoveWhenExists() {
        when(favoriteRepository.existsByUserIdAndBusinessId(1L, 10L)).thenReturn(true);

        boolean result = favoriteService.toggleFavorite(1L, 10L);

        assertThat(result).isFalse();
        verify(favoriteRepository).deleteByUserIdAndBusinessId(1L, 10L);
    }

    @Test
    @DisplayName("toggleFavorite debe agregar si no existe y retornar true")
    void toggleFavorite_shouldAddWhenNotExists() {
        // First call in toggleFavorite returns false (not exists)
        // Second call inside addFavorite also returns false (still doesn't exist)
        when(favoriteRepository.existsByUserIdAndBusinessId(1L, 10L)).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(businessRepository.findByIdBasic(10L)).thenReturn(Optional.of(testBusiness));

        boolean result = favoriteService.toggleFavorite(1L, 10L);

        assertThat(result).isTrue();
        verify(favoriteRepository).save(any(Favorite.class));
    }

    // ===== countUserFavorites =====

    @Test
    @DisplayName("countUserFavorites debe retornar el conteo correcto")
    void countUserFavorites_shouldReturnCount() {
        when(favoriteRepository.countByUserId(1L)).thenReturn(7L);

        assertThat(favoriteService.countUserFavorites(1L)).isEqualTo(7L);
    }

    // ===== getUserFavoriteIds =====

    @Test
    @DisplayName("getUserFavoriteIds debe retornar Set de IDs")
    void getUserFavoriteIds_shouldReturnIdSet() {
        when(favoriteRepository.findBusinessIdsByUserId(1L)).thenReturn(List.of(10L, 20L, 30L));

        Set<Long> ids = favoriteService.getUserFavoriteIds(1L);

        assertThat(ids).containsExactlyInAnyOrder(10L, 20L, 30L);
    }

    @Test
    @DisplayName("getUserFavoriteIds debe retornar Set vacío cuando no hay favoritos")
    void getUserFavoriteIds_shouldReturnEmptySetWhenNone() {
        when(favoriteRepository.findBusinessIdsByUserId(1L)).thenReturn(List.of());

        Set<Long> ids = favoriteService.getUserFavoriteIds(1L);

        assertThat(ids).isEmpty();
    }

    // ===== getAllUserFavorites =====

    @Test
    @DisplayName("getAllUserFavorites debe retornar lista de resúmenes")
    void getAllUserFavorites_shouldReturnSummaryList() {
        when(favoriteRepository.findByUserIdWithBusiness(1L)).thenReturn(List.of(testFavorite));
        when(businessService.toSummaryResponse(testBusiness))
                .thenReturn(BusinessSummaryResponse.builder().id(10L).name("Test Barbería").build());

        List<BusinessSummaryResponse> result = favoriteService.getAllUserFavorites(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Test Barbería");
    }
}
