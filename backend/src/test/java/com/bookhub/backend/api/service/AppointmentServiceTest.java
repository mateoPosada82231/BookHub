package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.appointment.AppointmentResponse;
import com.bookhub.backend.api.dto.appointment.CreateAppointmentRequest;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ConflictException;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.domain.booking.Appointment;
import com.bookhub.backend.domain.booking.AppointmentRepository;
import com.bookhub.backend.domain.booking.AppointmentStatus;
import com.bookhub.backend.domain.booking.ReviewRepository;
import com.bookhub.backend.domain.business.*;
import com.bookhub.backend.domain.user.Profile;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private WorkerScheduleRepository workerScheduleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private InputSanitizer sanitizer;

    @Mock
    private EmailService emailService;

        @Mock
        private NotificationService notificationService;

    @InjectMocks
    private AppointmentService appointmentService;

    private User client;
    private User workerUser;
    private Worker worker;
    private Business business;
    private Service service;
    private WorkerSchedule schedule;

    @BeforeEach
    void setUp() {
        // Client
        client = User.builder()
                .id(1L)
                .email("client@test.com")
                .role(UserRole.CLIENT)
                .enabled(true)
                .build();
        client.setProfile(Profile.builder().fullName("Test Client").phone("123456789").build());

        // Owner
        User owner = User.builder()
                .id(2L)
                .email("owner@test.com")
                .role(UserRole.OWNER)
                .build();

        // Business
        business = Business.builder()
                .id(1L)
                .owner(owner)
                .name("Test Barbería")
                .category(BusinessCategory.BARBERSHOP)
                .address("Calle Test 123")
                .active(true)
                .build();

        // Worker User
        workerUser = User.builder()
                .id(3L)
                .email("worker@test.com")
                .role(UserRole.WORKER)
                .enabled(true)
                .build();
        workerUser.setProfile(Profile.builder().fullName("Test Worker").build());

        // Worker
        worker = Worker.builder()
                .id(1L)
                .user(workerUser)
                .business(business)
                .position("Barbero")
                .active(true)
                .build();

        // Service
        service = Service.builder()
                .id(1L)
                .business(business)
                .name("Corte de pelo")
                .durationMinutes(30)
                .price(BigDecimal.valueOf(15.00))
                .active(true)
                .build();

        // Schedule (Monday 9-18)
        schedule = WorkerSchedule.builder()
                .id(1L)
                .worker(worker)
                .dayOfWeek(1) // Monday
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(18, 0))
                .available(true)
                .build();
    }

    @Test
    @DisplayName("Debe crear cita correctamente")
    void createAppointment_shouldCreateSuccessfully() {
        // Given - Next Monday at 10:00
        LocalDateTime nextMonday = LocalDateTime.now()
                .plusWeeks(1)
                .with(java.time.DayOfWeek.MONDAY)
                .withHour(10)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .workerId(1L)
                .serviceId(1L)
                .startTime(nextMonday)
                .clientNotes("Primera cita")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(client));
        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(serviceRepository.findById(1L)).thenReturn(Optional.of(service));
        when(workerScheduleRepository.findByWorkerIdAndAvailableTrue(1L)).thenReturn(List.of(schedule));
        when(appointmentRepository.findOverlappingAppointments(eq(1L), any(), any())).thenReturn(List.of());
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            a.setId(1L);
            return a;
        });

        // When
        AppointmentResponse result = appointmentService.createAppointment(1L, request);

        // Then
        assertThat(result.getServiceName()).isEqualTo("Corte de pelo");
        assertThat(result.getStatus()).isEqualTo(AppointmentStatus.PENDING);
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando hay citas superpuestas")
    void createAppointment_shouldThrowWhenOverlapping() {
        // Given
        LocalDateTime nextMonday = LocalDateTime.now()
                .plusWeeks(1)
                .with(java.time.DayOfWeek.MONDAY)
                .withHour(10)
                .withMinute(0);

        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .workerId(1L)
                .serviceId(1L)
                .startTime(nextMonday)
                .build();

        Appointment existingAppointment = Appointment.builder()
                .id(99L)
                .status(AppointmentStatus.CONFIRMED)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(client));
        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(serviceRepository.findById(1L)).thenReturn(Optional.of(service));
        when(workerScheduleRepository.findByWorkerIdAndAvailableTrue(1L)).thenReturn(List.of(schedule));
        when(appointmentRepository.findOverlappingAppointments(eq(1L), any(), any()))
                .thenReturn(List.of(existingAppointment));

        // When/Then
        assertThatThrownBy(() -> appointmentService.createAppointment(1L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ya tiene una cita");
    }

    @Test
    @DisplayName("Debe lanzar excepción cuando servicio no está activo")
    void createAppointment_shouldThrowWhenServiceInactive() {
        // Given
        service.setActive(false);

        CreateAppointmentRequest request = CreateAppointmentRequest.builder()
                .workerId(1L)
                .serviceId(1L)
                .startTime(LocalDateTime.now().plusDays(1))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(client));
        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(serviceRepository.findById(1L)).thenReturn(Optional.of(service));

        // When/Then
        assertThatThrownBy(() -> appointmentService.createAppointment(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("servicio no está disponible");
    }
}

