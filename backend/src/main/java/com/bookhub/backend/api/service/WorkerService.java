package com.bookhub.backend.api.service;

import com.bookhub.backend.api.dto.business.*;
import com.bookhub.backend.api.exception.BadRequestException;
import com.bookhub.backend.api.exception.ConflictException;
import com.bookhub.backend.api.exception.ForbiddenException;
import com.bookhub.backend.api.exception.ResourceNotFoundException;
import com.bookhub.backend.domain.business.*;
import com.bookhub.backend.domain.user.User;
import com.bookhub.backend.domain.user.UserRepository;
import com.bookhub.backend.domain.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkerService {

    private final WorkerRepository workerRepository;
    private final WorkerScheduleRepository workerScheduleRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;

    private static final String[] DAY_NAMES = {
            "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
    };

    /**
     * Get all workers for a business
     */
    @Transactional(readOnly = true)
    public List<WorkerResponse> getWorkersByBusiness(Long businessId) {
        return workerRepository.findByBusinessIdWithProfile(businessId)
                .stream()
                .map(this::toResponseWithSchedule)
                .collect(Collectors.toList());
    }

    /**
     * Get worker by ID
     */
    @Transactional(readOnly = true)
    public WorkerResponse getWorkerById(Long id) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trabajador", id));
        return toResponseWithSchedule(worker);
    }

    /**
     * Get businesses where user is a worker
     */
    @Transactional(readOnly = true)
    public List<WorkerResponse> getWorkerProfilesForUser(Long userId) {
        return workerRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Add a worker to a business
     */
    @Transactional
    public WorkerResponse addWorker(Long businessId, Long ownerId, CreateWorkerRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Negocio", businessId));

        // Verify ownership
        if (!business.getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("No tienes permiso para agregar trabajadores a este negocio");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario con email " + request.getEmail() + " no encontrado"));

        // Validate user role - only CLIENT can become WORKER
        // OWNER cannot be added as worker to prevent conflicts
        if (user.getRole() == UserRole.OWNER) {
            throw new BadRequestException("No se puede agregar como trabajador a un usuario que es dueño de un negocio. " +
                    "El usuario debe tener rol de cliente.");
        }

        // Upgrade CLIENT to WORKER role
        if (user.getRole() == UserRole.CLIENT) {
            user.setRole(UserRole.WORKER);
            userRepository.save(user);
        }

        // Check if already a worker in this business
        if (workerRepository.findByUserIdAndBusinessId(user.getId(), businessId).isPresent()) {
            throw new ConflictException("El usuario ya es trabajador de este negocio");
        }

        Worker worker = Worker.builder()
                .user(user)
                .business(business)
                .position(request.getPosition())
                .active(true)
                .build();

        worker = workerRepository.save(worker);

        return toResponse(worker);
    }

    /**
     * Update worker
     */
    @Transactional
    public WorkerResponse updateWorker(Long workerId, Long ownerId, UpdateWorkerRequest request) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trabajador", workerId));

        // Verify ownership
        if (!worker.getBusiness().getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("No tienes permiso para modificar este trabajador");
        }

        if (request.getPosition() != null) {
            worker.setPosition(request.getPosition());
        }
        if (request.getActive() != null) {
            worker.setActive(request.getActive());
        }

        worker = workerRepository.save(worker);

        return toResponse(worker);
    }

    /**
     * Remove worker (soft delete)
     */
    @Transactional
    public void removeWorker(Long workerId, Long ownerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trabajador", workerId));

        if (!worker.getBusiness().getOwner().getId().equals(ownerId)) {
            throw new ForbiddenException("No tienes permiso para eliminar este trabajador");
        }

        worker.setActive(false);
        workerRepository.save(worker);
    }

    /**
     * Set worker schedule
     */
    @Transactional
    public WorkerResponse setWorkerSchedule(Long workerId, Long userId, List<WorkerScheduleRequest> schedules) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Trabajador", workerId));

        // Can be updated by owner or the worker themselves
        boolean isOwner = worker.getBusiness().getOwner().getId().equals(userId);
        boolean isWorker = worker.getUser().getId().equals(userId);

        if (!isOwner && !isWorker) {
            throw new ForbiddenException("No tienes permiso para modificar este horario");
        }

        // Delete existing schedules
        workerScheduleRepository.deleteByWorkerId(workerId);

        // Create new schedules
        for (WorkerScheduleRequest scheduleReq : schedules) {
            if (scheduleReq.getEndTime().isBefore(scheduleReq.getStartTime()) ||
                    scheduleReq.getEndTime().equals(scheduleReq.getStartTime())) {
                throw new BadRequestException("La hora de fin debe ser posterior a la hora de inicio");
            }

            WorkerSchedule schedule = WorkerSchedule.builder()
                    .worker(worker)
                    .dayOfWeek(scheduleReq.getDayOfWeek())
                    .startTime(scheduleReq.getStartTime())
                    .endTime(scheduleReq.getEndTime())
                    .available(scheduleReq.getAvailable() != null ? scheduleReq.getAvailable() : true)
                    .build();

            workerScheduleRepository.save(schedule);
        }

        // Reload worker with schedules
        worker = workerRepository.findById(workerId).get();

        return toResponseWithSchedule(worker);
    }

    private WorkerResponse toResponse(Worker worker) {
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

    private WorkerResponse toResponseWithSchedule(Worker worker) {
        WorkerResponse response = toResponse(worker);

        List<WorkerScheduleResponse> schedules = workerScheduleRepository.findByWorkerId(worker.getId())
                .stream()
                .map(this::toScheduleResponse)
                .collect(Collectors.toList());

        response.setSchedules(schedules);

        return response;
    }

    private WorkerScheduleResponse toScheduleResponse(WorkerSchedule schedule) {
        return WorkerScheduleResponse.builder()
                .id(schedule.getId())
                .dayOfWeek(schedule.getDayOfWeek())
                .dayName(DAY_NAMES[schedule.getDayOfWeek()])
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .available(schedule.isAvailable())
                .build();
    }
}

