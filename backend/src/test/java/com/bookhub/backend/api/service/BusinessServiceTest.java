package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.BusinessResponse;
import com.bookhub.backend.api.dto.business.BusinessSummaryResponse;
import com.bookhub.backend.api.dto.business.CreateBusinessRequest;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.domain.business.Business;
import com.bookhub.backend.domain.business.BusinessCategory;
import com.bookhub.backend.domain.business.BusinessRepository;
import com.bookhub.backend.domain.business.ServiceRepository;
import com.bookhub.backend.domain.business.WorkerRepository;
import com.bookhub.backend.domain.user.Profile;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import com.bookhub.backend.domain.user.UserRole;
import com.bookhub.backend.config.InputSanitizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessServiceTest {

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private com.bookhub.backend.domain.booking.AppointmentRepository appointmentRepository;

    @Mock
    private InputSanitizer sanitizer;

    @Mock
    private com.bookhub.backend.api.mapper.ServiceMapper serviceMapper;

    @Mock
    private com.bookhub.backend.api.mapper.WorkerMapper workerMapper;

    @InjectMocks
    private BusinessService businessService;

    private User owner;
    private Business business;

    @BeforeEach
    void setUp() {
        // Default sanitizer behavior: return the same input
        lenient().when(sanitizer.sanitize(anyString())).thenAnswer(i -> i.getArgument(0));
        lenient().when(sanitizer.sanitizeUrl(anyString())).thenAnswer(i -> i.getArgument(0));

        owner = User.builder()
                .id(1L)
                .email("owner@test.com")
                .role(UserRole.OWNER)
                .enabled(true)
                .build();

        Profile profile = Profile.builder()
                .fullName("Test Owner")
                .build();
        owner.setProfile(profile);

        business = Business.builder()
                .id(1L)
                .owner(owner)
                .name("Test Barbería")
                .category(BusinessCategory.BARBERSHOP)
                .description("Una barbería de prueba")
                .address("Calle Test 123")
                .city("Ciudad Test")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Debe buscar negocios activos con paginación")
    void searchBusinesses_shouldReturnPagedResults() {
        // Given
        Page<Business> businessPage = new PageImpl<>(List.of(business));
        when(businessRepository.findByActiveTrue(any(Pageable.class))).thenReturn(businessPage);

        // When
        PageResponse<BusinessSummaryResponse> result = businessService.searchBusinesses(null, null, null, null, null, 0, 10);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Test Barbería");
        verify(businessRepository).findByActiveTrue(any(Pageable.class));
    }

    @Test
    @DisplayName("Debe obtener negocio por ID")
    void getBusinessById_shouldReturnBusiness() {
        // Given
        when(businessRepository.findById(1L)).thenReturn(Optional.of(business));
        lenient().when(serviceRepository.findByBusinessIdAndActiveTrue(1L)).thenReturn(List.of());
        lenient().when(workerRepository.findByBusinessIdWithProfile(1L)).thenReturn(List.of());

        // When
        BusinessResponse result = businessService.getBusinessById(1L);

        // Then
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Test Barbería");
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando negocio no existe")
    void getBusinessById_shouldThrowWhenNotFound() {
        // Given
        when(businessRepository.findById(999L)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> businessService.getBusinessById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Negocio");
    }

    @Test
    @DisplayName("Debe crear negocio correctamente")
    void createBusiness_shouldCreateSuccessfully() {
        // Given
        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("Nueva Barbería")
                .category(BusinessCategory.BARBERSHOP)
                .description("Descripción")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(businessRepository.save(any(Business.class))).thenAnswer(i -> {
            Business b = i.getArgument(0);
            b.setId(2L);
            return b;
        });
        lenient().when(serviceRepository.findByBusinessIdAndActiveTrue(any())).thenReturn(List.of());
        lenient().when(workerRepository.findByBusinessIdWithProfile(any())).thenReturn(List.of());

        // When
        BusinessResponse result = businessService.createBusiness(1L, request);

        // Then
        assertThat(result.getName()).isEqualTo("Nueva Barbería");
        verify(businessRepository).save(any(Business.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción al crear negocio sin rol OWNER")
    void createBusiness_shouldThrowWhenNotOwner() {
        // Given
        User client = User.builder()
                .id(2L)
                .email("client@test.com")
                .role(UserRole.CLIENT)
                .build();

        CreateBusinessRequest request = CreateBusinessRequest.builder()
                .name("Test")
                .category(BusinessCategory.BARBERSHOP)
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(client));

        // When/Then
        assertThatThrownBy(() -> businessService.createBusiness(2L, request))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("Debe eliminar negocio (soft delete)")
    void deleteBusiness_shouldSoftDelete() {
        // Given
        when(businessRepository.findByIdBasic(1L)).thenReturn(Optional.of(business));

        // When
        businessService.deleteBusiness(1L, 1L);

        // Then
        verify(businessRepository).save(argThat(b -> !b.isActive()));
    }
}

