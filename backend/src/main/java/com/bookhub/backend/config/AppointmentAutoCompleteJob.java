package com.bookhub.backend.config;

import com.bookhub.backend.domain.booking.Appointment;
import com.bookhub.backend.domain.booking.AppointmentRepository;
import com.bookhub.backend.domain.booking.AppointmentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job to auto-complete appointments that have passed their end time.
 * If no issues were reported (no-show, cancellation), the appointment is
 * automatically marked as COMPLETED after its scheduled end time.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentAutoCompleteJob {

    private final AppointmentRepository appointmentRepository;

    /**
     * Runs every 15 minutes. Finds all PENDING or CONFIRMED appointments
     * whose end_time has already passed and marks them as COMPLETED.
     */
    @Scheduled(fixedRate = 15 * 60 * 1000) // 15 minutes
    @Transactional
    public void autoCompletePastAppointments() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<Appointment> pastAppointments = appointmentRepository.findPastPendingOrConfirmed(now);

            if (pastAppointments.isEmpty()) {
                return;
            }

            int count = 0;
            for (Appointment appointment : pastAppointments) {
                appointment.setStatus(AppointmentStatus.COMPLETED);
                appointmentRepository.save(appointment);
                count++;
            }

            log.info("Auto-completed {} past appointments", count);
        } catch (Exception e) {
            log.error("Error auto-completing past appointments", e);
        }
    }
}
