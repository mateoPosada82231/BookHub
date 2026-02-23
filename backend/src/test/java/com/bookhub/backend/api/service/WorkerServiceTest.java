package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ConflictException;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.api.mapper.WorkerMapper;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.domain.business.*;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import com.bookhub.backend.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkerServiceTest {

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private WorkerScheduleRepository workerScheduleRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InputSanitizer sanitizer;

    @Mock
    private WorkerMapper workerMapper;

    @InjectMocks
    private WorkerService workerService;

    private User owner;
    private User clientUser;
    private Business testBusiness;
    private Worker testWorker;
    private WorkerResponse testWorkerResponse;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .email("owner@test.com")
                .role(UserRole.OWNER)
                .enabled(true)
                .build();

        clientUser = User.builder()
                .id(2L)
                .email("client@test.com")
                .role(UserRole.CLIENT)
                .enabled(true)
                .build();

        testBusiness = Business.builder()
                .id(10L)
                .name("Test Barbería")
                .owner(owner)
                .category(BusinessCategory.BARBERSHOP)
                .build();

        testWorker = Worker.builder()
                .id(100L)
                .user(clientUser)
                .business(testBusiness)
                .position("Barbero")
                .active(true)
                .build();

        testWorkerResponse = WorkerResponse.builder()
                .id(100L)
                .userId(2L)
                .fullName("Client User")
                .position("Barbero")
                .active(true)
                .businessId(10L)
                .build();

        lenient().when(sanitizer.sanitize(anyString())).thenAnswer(i -> i.getArgument(0));
        lenient().when(workerMapper.toResponse(any(Worker.class))).thenReturn(testWorkerResponse);
    }

    // ===== addWorker =====

    @Test
    @DisplayName("addWorker debe agregar trabajador correctamente")
    void addWorker_shouldAddWorker() {
        CreateWorkerRequest request = CreateWorkerRequest.builder()
                .email("client@test.com")
                .position("Barbero Senior")
                .build();

        when(businessRepository.findByIdBasic(10L)).thenReturn(Optional.of(testBusiness));
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(clientUser));
        when(workerRepository.findByUserIdAndBusinessId(2L, 10L)).thenReturn(Optional.empty());
        when(workerRepository.save(any(Worker.class))).thenReturn(testWorker);

        WorkerResponse result = workerService.addWorker(10L, 1L, request);

        assertThat(result).isNotNull();
        verify(workerRepository).save(any(Worker.class));
        // CLIENT should be upgraded to WORKER
        verify(userRepository).save(argThat(u -> u.getRole() == UserRole.WORKER));
    }

    @Test
    @DisplayName("addWorker no debe permitir agregar OWNER como trabajador")
    void addWorker_shouldRejectOwnerRole() {
        User anotherOwner = User.builder()
                .id(5L)
                .email("other-owner@test.com")
                .role(UserRole.OWNER)
                .build();

        CreateWorkerRequest request = CreateWorkerRequest.builder()
                .email("other-owner@test.com")
                .build();

        when(businessRepository.findByIdBasic(10L)).thenReturn(Optional.of(testBusiness));
        when(userRepository.findByEmail("other-owner@test.com")).thenReturn(Optional.of(anotherOwner));

        assertThatThrownBy(() -> workerService.addWorker(10L, 1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("dueño");
    }

    @Test
    @DisplayName("addWorker debe lanzar excepción si no es dueño del negocio")
    void addWorker_shouldThrowWhenNotOwner() {
        CreateWorkerRequest request = CreateWorkerRequest.builder()
                .email("client@test.com")
                .build();

        when(businessRepository.findByIdBasic(10L)).thenReturn(Optional.of(testBusiness));

        assertThatThrownBy(() -> workerService.addWorker(10L, 99L, request))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("addWorker debe lanzar excepción si el usuario ya es trabajador")
    void addWorker_shouldThrowWhenDuplicate() {
        CreateWorkerRequest request = CreateWorkerRequest.builder()
                .email("client@test.com")
                .build();

        when(businessRepository.findByIdBasic(10L)).thenReturn(Optional.of(testBusiness));
        when(userRepository.findByEmail("client@test.com")).thenReturn(Optional.of(clientUser));
        when(workerRepository.findByUserIdAndBusinessId(2L, 10L)).thenReturn(Optional.of(testWorker));

        assertThatThrownBy(() -> workerService.addWorker(10L, 1L, request))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("addWorker debe lanzar excepción si negocio no existe")
    void addWorker_shouldThrowWhenBusinessNotFound() {
        CreateWorkerRequest request = CreateWorkerRequest.builder()
                .email("client@test.com")
                .build();

        when(businessRepository.findByIdBasic(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workerService.addWorker(99L, 1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ===== removeWorker =====

    @Test
    @DisplayName("removeWorker debe hacer soft delete del trabajador")
    void removeWorker_shouldSoftDelete() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));

        workerService.removeWorker(100L, 1L);

        verify(workerRepository).save(argThat(w -> !w.isActive()));
    }

    @Test
    @DisplayName("removeWorker debe lanzar excepción si no es dueño")
    void removeWorker_shouldThrowWhenNotOwner() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));

        assertThatThrownBy(() -> workerService.removeWorker(100L, 99L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("removeWorker debe lanzar excepción si trabajador no existe")
    void removeWorker_shouldThrowWhenNotFound() {
        when(workerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workerService.removeWorker(999L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ===== updateWorker =====

    @Test
    @DisplayName("updateWorker debe actualizar la posición")
    void updateWorker_shouldUpdatePosition() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));
        when(workerRepository.save(any(Worker.class))).thenReturn(testWorker);

        UpdateWorkerRequest request = UpdateWorkerRequest.builder()
                .position("Barbero Senior")
                .build();

        workerService.updateWorker(100L, 1L, request);

        verify(workerRepository).save(argThat(w -> w.getPosition().equals("Barbero Senior")));
    }

    @Test
    @DisplayName("updateWorker debe actualizar estado activo")
    void updateWorker_shouldUpdateActiveStatus() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));
        when(workerRepository.save(any(Worker.class))).thenReturn(testWorker);

        UpdateWorkerRequest request = UpdateWorkerRequest.builder()
                .active(false)
                .build();

        workerService.updateWorker(100L, 1L, request);

        verify(workerRepository).save(argThat(w -> !w.isActive()));
    }

    @Test
    @DisplayName("updateWorker debe lanzar excepción si no es dueño")
    void updateWorker_shouldThrowWhenNotOwner() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));

        UpdateWorkerRequest request = UpdateWorkerRequest.builder().position("X").build();

        assertThatThrownBy(() -> workerService.updateWorker(100L, 99L, request))
                .isInstanceOf(ForbiddenException.class);
    }

    // ===== setWorkerSchedule =====

    @Test
    @DisplayName("setWorkerSchedule debe guardar horarios válidos")
    void setWorkerSchedule_shouldSaveValidSchedules() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));

        WorkerScheduleRequest schedule = WorkerScheduleRequest.builder()
                .dayOfWeek(1)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(18, 0))
                .available(true)
                .build();

        workerService.setWorkerSchedule(100L, 1L, List.of(schedule));

        verify(workerScheduleRepository).deleteByWorkerId(100L);
        verify(workerScheduleRepository).save(any(WorkerSchedule.class));
    }

    @Test
    @DisplayName("setWorkerSchedule debe lanzar excepción si hora fin <= hora inicio")
    void setWorkerSchedule_shouldThrowWhenEndBeforeStart() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));

        WorkerScheduleRequest schedule = WorkerScheduleRequest.builder()
                .dayOfWeek(1)
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(9, 0))
                .available(true)
                .build();

        assertThatThrownBy(() -> workerService.setWorkerSchedule(100L, 1L, List.of(schedule)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("hora de fin");
    }

    @Test
    @DisplayName("setWorkerSchedule debe permitir al propio trabajador configurar su horario")
    void setWorkerSchedule_shouldAllowWorkerSelf() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));

        WorkerScheduleRequest schedule = WorkerScheduleRequest.builder()
                .dayOfWeek(1)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .available(true)
                .build();

        // userId=2L is the worker's own user ID
        workerService.setWorkerSchedule(100L, 2L, List.of(schedule));

        verify(workerScheduleRepository).save(any(WorkerSchedule.class));
    }

    @Test
    @DisplayName("setWorkerSchedule debe lanzar excepción si no es dueño ni trabajador")
    void setWorkerSchedule_shouldThrowWhenUnauthorized() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));

        WorkerScheduleRequest schedule = WorkerScheduleRequest.builder()
                .dayOfWeek(1)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(17, 0))
                .build();

        assertThatThrownBy(() -> workerService.setWorkerSchedule(100L, 99L, List.of(schedule)))
                .isInstanceOf(ForbiddenException.class);
    }

    // ===== getWorkerById =====

    @Test
    @DisplayName("getWorkerById debe retornar el trabajador cuando existe")
    void getWorkerById_shouldReturnWorker() {
        when(workerRepository.findById(100L)).thenReturn(Optional.of(testWorker));

        WorkerResponse result = workerService.getWorkerById(100L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("getWorkerById debe lanzar excepción si no existe")
    void getWorkerById_shouldThrowWhenNotFound() {
        when(workerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workerService.getWorkerById(999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
