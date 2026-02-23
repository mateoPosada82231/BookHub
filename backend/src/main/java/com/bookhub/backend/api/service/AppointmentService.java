package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.appointment.*;
import com.bookhub.backend.api.dto.common.PageResponse;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ConflictException;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.config.InputSanitizer;
import com.bookhub.backend.domain.booking.*;
import com.bookhub.backend.domain.business.*;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ReviewRepository reviewRepository;
    private final WorkerRepository workerRepository;
    private final ServiceRepository serviceRepository;
    private final WorkerScheduleRepository workerScheduleRepository;
    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final InputSanitizer sanitizer;
    private final EmailService emailService;

    /**
     * Create a new appointment
     */
    @Transactional
    public AppointmentResponse createAppointment(Long clientId, CreateAppointmentRequest request) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", clientId));

        Worker worker = workerRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new ResourceNotFoundException("Trabajador", request.getWorkerId()));

        if (!worker.isActive()) {
            throw new BadRequestException("El trabajador no está disponible");
        }

        com.bookhub.backend.domain.business.Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Servicio", request.getServiceId()));

        if (!service.isActive()) {
            throw new BadRequestException("El servicio no está disponible");
        }

        // Verify service belongs to worker's business
        if (!service.getBusiness().getId().equals(worker.getBusiness().getId())) {
            throw new BadRequestException("El servicio no pertenece al negocio del trabajador seleccionado");
        }

        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());

        // Validate appointment is not in the past (15-minute buffer)
        LocalDateTime minimumTime = LocalDateTime.now().plusMinutes(15);
        if (startTime.isBefore(minimumTime)) {
            throw new BadRequestException("No se pueden agendar citas en el pasado. Debe ser al menos 15 minutos en el futuro");
        }

        // Validate worker availability (schedule)
        validateWorkerSchedule(worker.getId(), startTime, endTime);

        // Check for overlapping appointments
        List<Appointment> overlapping = appointmentRepository.findOverlappingAppointments(
                worker.getId(), startTime, endTime);

        if (!overlapping.isEmpty()) {
            throw new ConflictException("El trabajador ya tiene una cita en ese horario");
        }

        Appointment appointment = Appointment.builder()
                .client(client)
                .worker(worker)
                .service(service)
                .startTime(startTime)
                .endTime(endTime)
                .status(AppointmentStatus.PENDING)
                .clientNotes(sanitizer.sanitize(request.getClientNotes()))
                .build();

        appointment = appointmentRepository.save(appointment);

        // Send confirmation email
        try {
            String clientName = client.getProfile() != null ? client.getProfile().getFullName() : client.getEmail();
            String businessName = worker.getBusiness().getName();
            String serviceName = service.getName();
            String appointmentDate = startTime.toString();
            emailService.sendAppointmentConfirmation(client.getEmail(), clientName, businessName, serviceName, appointmentDate);
        } catch (Exception e) {
            // Don't fail appointment creation if email fails
        }

        return toResponse(appointment);
    }

    /**
     * Get appointment by ID
     */
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id, Long userId) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", id));

        // Verify access (client, worker, or business owner)
        boolean isClient = appointment.getClient().getId().equals(userId);
        boolean isWorker = appointment.getWorker().getUser().getId().equals(userId);
        boolean isOwner = appointment.getWorker().getBusiness().getOwner().getId().equals(userId);

        if (!isClient && !isWorker && !isOwner) {
            throw new ForbiddenException("No tienes permiso para ver esta cita");
        }

        return toResponse(appointment);
    }

    /**
     * Get appointments for a client
     */
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getClientAppointments(Long clientId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        Page<Appointment> appointments = appointmentRepository.findByClientIdOrderByStartTimeDesc(clientId, pageable);

        return toPageResponse(appointments);
    }

    /**
     * Get upcoming appointments for a client
     */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUpcomingClientAppointments(Long clientId) {
        return appointmentRepository.findUpcomingForClient(clientId, LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get appointments for a worker
     */
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> getWorkerAppointments(Long workerId, Long userId, int page, int size) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trabajador", workerId));

        // Verify access
        boolean isWorker = worker.getUser().getId().equals(userId);
        boolean isOwner = worker.getBusiness().getOwner().getId().equals(userId);

        if (!isWorker && !isOwner) {
            throw new ForbiddenException("No tienes permiso para ver estas citas");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        Page<Appointment> appointments = appointmentRepository.findByWorkerIdOrderByStartTimeDesc(workerId, pageable);

        return toPageResponse(appointments);
    }

    /**
     * Get upcoming appointments for a worker
     */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUpcomingWorkerAppointments(Long workerId, Long userId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trabajador", workerId));

        // Verify access
        boolean isWorker = worker.getUser().getId().equals(userId);
        boolean isOwner = worker.getBusiness().getOwner().getId().equals(userId);

        if (!isWorker && !isOwner) {
            throw new ForbiddenException("No tienes permiso para ver estas citas");
        }

        return appointmentRepository.findUpcomingForWorker(workerId, LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update appointment status
     */
    @Transactional
    public AppointmentResponse updateAppointment(Long appointmentId, Long userId, UpdateAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", appointmentId));

        boolean isClient = appointment.getClient().getId().equals(userId);
        boolean isWorker = appointment.getWorker().getUser().getId().equals(userId);
        boolean isOwner = appointment.getWorker().getBusiness().getOwner().getId().equals(userId);

        if (!isClient && !isWorker && !isOwner) {
            throw new ForbiddenException("No tienes permiso para modificar esta cita");
        }

        if (request.getStatus() != null) {
            validateStatusTransition(appointment.getStatus(), request.getStatus(), isClient);
            appointment.setStatus(request.getStatus());

            if (request.getStatus() == AppointmentStatus.CANCELLED) {
                appointment.setCancellationReason(sanitizer.sanitize(request.getCancellationReason()));
            }
        }

        appointment = appointmentRepository.save(appointment);

        return toResponse(appointment);
    }

    /**
     * Cancel appointment
     */
    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, Long userId, String reason) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", appointmentId));

        boolean isClient = appointment.getClient().getId().equals(userId);
        boolean isWorker = appointment.getWorker().getUser().getId().equals(userId);
        boolean isOwner = appointment.getWorker().getBusiness().getOwner().getId().equals(userId);

        if (!isClient && !isWorker && !isOwner) {
            throw new ForbiddenException("No tienes permiso para cancelar esta cita");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED ||
                appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BadRequestException("No se puede cancelar una cita que ya está " +
                    appointment.getStatus().name().toLowerCase());
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(sanitizer.sanitize(reason));

        appointment = appointmentRepository.save(appointment);

        // Send cancellation email
        try {
            String clientName = appointment.getClient().getProfile() != null
                    ? appointment.getClient().getProfile().getFullName()
                    : appointment.getClient().getEmail();
            String businessName = appointment.getWorker().getBusiness().getName();
            emailService.sendAppointmentCancellation(
                    appointment.getClient().getEmail(), clientName, businessName, reason != null ? reason : "No especificada");
        } catch (Exception e) {
            // Don't fail cancellation if email fails
        }

        return toResponse(appointment);
    }

    /**
     * Reschedule an appointment to a new time
     */
    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, Long userId, RescheduleAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", appointmentId));

        boolean isClient = appointment.getClient().getId().equals(userId);
        boolean isWorker = appointment.getWorker().getUser().getId().equals(userId);
        boolean isOwner = appointment.getWorker().getBusiness().getOwner().getId().equals(userId);

        if (!isClient && !isWorker && !isOwner) {
            throw new ForbiddenException("No tienes permiso para reagendar esta cita");
        }

        // Only PENDING or CONFIRMED can be rescheduled
        if (appointment.getStatus() != AppointmentStatus.PENDING &&
                appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Solo se pueden reagendar citas pendientes o confirmadas");
        }

        LocalDateTime newStartTime = request.getNewStartTime();
        int durationMinutes = appointment.getService().getDurationMinutes();
        LocalDateTime newEndTime = newStartTime.plusMinutes(durationMinutes);

        // Validate time is not in the past
        LocalDateTime minimumTime = LocalDateTime.now().plusMinutes(15);
        if (newStartTime.isBefore(minimumTime)) {
            throw new BadRequestException("La nueva hora debe ser al menos 15 minutos en el futuro");
        }

        // Validate worker availability
        validateWorkerSchedule(appointment.getWorker().getId(), newStartTime, newEndTime);

        // Check for overlapping appointments (excluding self)
        List<Appointment> overlapping = appointmentRepository.findOverlappingAppointments(
                appointment.getWorker().getId(), newStartTime, newEndTime);
        overlapping.removeIf(a -> a.getId().equals(appointmentId));

        if (!overlapping.isEmpty()) {
            throw new ConflictException("El trabajador ya tiene una cita en ese horario");
        }

        appointment.setStartTime(newStartTime);
        appointment.setEndTime(newEndTime);
        // Reset to PENDING when rescheduled
        appointment.setStatus(AppointmentStatus.PENDING);

        appointment = appointmentRepository.save(appointment);

        return toResponse(appointment);
    }

    /**
     * Create a review for a completed appointment
     */
    /**
     * Create a review for a completed appointment
     */
    @CacheEvict(value = "business-detail", allEntries = true)
    @Transactional
    public ReviewResponse createReview(Long appointmentId, Long clientId, CreateReviewRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Cita", appointmentId));

        // Verify client
        if (!appointment.getClient().getId().equals(clientId)) {
            throw new ForbiddenException("Solo el cliente puede dejar una reseña");
        }

        // Verify appointment is completed
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Solo se pueden reseñar citas completadas");
        }

        // Check if already has review
        if (appointment.getReview() != null) {
            throw new ConflictException("Esta cita ya tiene una reseña");
        }

        Review review = Review.builder()
                .appointment(appointment)
                .rating(request.getRating())
                .comment(sanitizer.sanitize(request.getComment()))
                .build();

        review = reviewRepository.save(review);

        // Update business rating
        updateBusinessRating(appointment.getWorker().getBusiness().getId());

        return toReviewResponse(review, appointment);
    }

    /**
     * Get paginated reviews for a business
     */
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getBusinessReviews(Long businessId, int page, int size) {
        businessRepository.findByIdBasic(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewRepository.findByBusinessIdPaged(businessId, pageable);

        List<ReviewResponse> content = reviews.getContent().stream()
                .map(review -> toReviewResponse(review, review.getAppointment()))
                .collect(Collectors.toList());

        return PageResponse.<ReviewResponse>builder()
                .content(content)
                .totalElements(reviews.getTotalElements())
                .totalPages(reviews.getTotalPages())
                .currentPage(reviews.getNumber())
                .pageSize(reviews.getSize())
                .first(reviews.isFirst())
                .last(reviews.isLast())
                .empty(reviews.isEmpty())
                .build();
    }

    // ========== HELPER METHODS ==========

    private void validateWorkerSchedule(Long workerId, LocalDateTime startTime, LocalDateTime endTime) {
        int dayOfWeek = startTime.getDayOfWeek().getValue() % 7; // Convert to 0=Sunday format
        LocalTime start = startTime.toLocalTime();
        LocalTime end = endTime.toLocalTime();

        List<WorkerSchedule> schedules = workerScheduleRepository.findByWorkerIdAndAvailableTrue(workerId);

        boolean isAvailable = schedules.stream()
                .filter(s -> s.getDayOfWeek() == dayOfWeek)
                .anyMatch(s -> !start.isBefore(s.getStartTime()) && !end.isAfter(s.getEndTime()));

        if (!isAvailable) {
            throw new BadRequestException("El trabajador no está disponible en ese horario");
        }
    }

    private void validateStatusTransition(AppointmentStatus current, AppointmentStatus next, boolean isClient) {
        // Clients can only cancel
        if (isClient && next != AppointmentStatus.CANCELLED) {
            throw new ForbiddenException("Los clientes solo pueden cancelar citas");
        }

        // Define valid transitions
        switch (current) {
            case PENDING:
                if (next != AppointmentStatus.CONFIRMED && next != AppointmentStatus.CANCELLED) {
                    throw new BadRequestException("Transición de estado no válida");
                }
                break;
            case CONFIRMED:
                if (next != AppointmentStatus.COMPLETED &&
                        next != AppointmentStatus.CANCELLED &&
                        next != AppointmentStatus.NO_SHOW) {
                    throw new BadRequestException("Transición de estado no válida");
                }
                break;
            case COMPLETED:
            case CANCELLED:
            case NO_SHOW:
                throw new BadRequestException("No se puede cambiar el estado de una cita finalizada");
        }
    }

    private void updateBusinessRating(Long businessId) {
        RatingStatsProjection stats = appointmentRepository.calculateBusinessRatingStats(businessId);

        if (stats.getAverageRating() == null) {
            return;
        }

        Business business = businessRepository.findByIdBasic(businessId).orElseThrow();
        business.setAverageRating(BigDecimal.valueOf(stats.getAverageRating()).setScale(1, RoundingMode.HALF_UP));
        business.setTotalReviews(stats.getTotalReviews().intValue());
        businessRepository.save(business);
    }

    private AppointmentResponse toResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .clientId(appointment.getClient().getId())
                .clientName(appointment.getClient().getProfile() != null
                        ? appointment.getClient().getProfile().getFullName()
                        : null)
                .clientPhone(appointment.getClient().getProfile() != null
                        ? appointment.getClient().getProfile().getPhone()
                        : null)
                .workerId(appointment.getWorker().getId())
                .workerName(appointment.getWorker().getUser().getProfile() != null
                        ? appointment.getWorker().getUser().getProfile().getFullName()
                        : null)
                .serviceId(appointment.getService().getId())
                .serviceName(appointment.getService().getName())
                .servicePrice(appointment.getService().getPrice())
                .serviceDuration(appointment.getService().getDurationMinutes())
                .businessId(appointment.getWorker().getBusiness().getId())
                .businessName(appointment.getWorker().getBusiness().getName())
                .businessAddress(appointment.getWorker().getBusiness().getAddress())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus())
                .clientNotes(appointment.getClientNotes())
                .cancellationReason(appointment.getCancellationReason())
                .createdAt(appointment.getCreatedAt())
                .hasReview(appointment.getReview() != null)
                .review(appointment.getReview() != null
                        ? toReviewResponse(appointment.getReview(), appointment)
                        : null)
                .build();
    }

    private ReviewResponse toReviewResponse(Review review, Appointment appointment) {
        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .appointmentId(appointment.getId())
                .clientName(appointment.getClient().getProfile() != null
                        ? appointment.getClient().getProfile().getFullName()
                        : null)
                .serviceName(appointment.getService().getName())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private PageResponse<AppointmentResponse> toPageResponse(Page<Appointment> page) {
        List<AppointmentResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<AppointmentResponse>builder()
                .content(content)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .first(page.isFirst())
                .last(page.isLast())
                .empty(page.isEmpty())
                .build();
    }

    /**
     * Get available time slots for a worker on a specific date
     */
    @Transactional(readOnly = true)
    public AvailabilityResponse getWorkerAvailability(Long workerId, LocalDate date, Integer durationMinutes) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trabajador", workerId));

        if (!worker.isActive()) {
            throw new BadRequestException("El trabajador no está disponible");
        }

        // Default duration is 30 minutes
        int duration = durationMinutes != null ? durationMinutes : 30;

        // Get day of week (1=Monday to 7=Sunday in Java, convert to 0=Sunday for our system)
        int dayOfWeek = date.getDayOfWeek().getValue() % 7; 

        // Find worker's schedule for this day
        List<WorkerSchedule> schedules = workerScheduleRepository.findByWorkerIdAndAvailableTrue(workerId);
        WorkerSchedule daySchedule = schedules.stream()
                .filter(s -> s.getDayOfWeek() == dayOfWeek)
                .findFirst()
                .orElse(null);

        List<AvailabilityResponse.TimeSlot> slots = new ArrayList<>();

        if (daySchedule != null) {
            // Get existing appointments for this worker on this date
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.atTime(23, 59, 59);
            
            List<Appointment> existingAppointments = appointmentRepository.findByWorkerIdAndDateRange(
                    workerId, dayStart, dayEnd);

            // Generate time slots
            LocalTime currentTime = daySchedule.getStartTime();
            LocalTime endTime = daySchedule.getEndTime();

            while (currentTime.plusMinutes(duration).isBefore(endTime) || 
                   currentTime.plusMinutes(duration).equals(endTime)) {
                
                LocalTime slotEnd = currentTime.plusMinutes(duration);
                final LocalTime slotStart = currentTime;
                
                // Check if slot overlaps with any existing appointment
                boolean isAvailable = existingAppointments.stream()
                        .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED
                                && a.getStatus() != AppointmentStatus.NO_SHOW)
                        .noneMatch(a -> {
                            LocalTime apptStart = a.getStartTime().toLocalTime();
                            LocalTime apptEnd = a.getEndTime().toLocalTime();
                            // Check for overlap
                            return !(slotEnd.isBefore(apptStart) || slotEnd.equals(apptStart) ||
                                    slotStart.isAfter(apptEnd) || slotStart.equals(apptEnd));
                        });

                // Don't allow bookings in the past
                if (date.equals(LocalDate.now()) && currentTime.isBefore(LocalTime.now())) {
                    isAvailable = false;
                }

                slots.add(AvailabilityResponse.TimeSlot.builder()
                        .startTime(currentTime)
                        .endTime(slotEnd)
                        .available(isAvailable)
                        .build());

                currentTime = currentTime.plusMinutes(30); // 30-minute intervals
            }
        }

        String workerName = worker.getUser().getProfile() != null 
                ? worker.getUser().getProfile().getFullName() 
                : worker.getUser().getEmail();

        return AvailabilityResponse.builder()
                .workerId(workerId)
                .workerName(workerName)
                .date(date)
                .availableSlots(slots)
                .build();
    }
}

