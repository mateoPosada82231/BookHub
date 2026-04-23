package com.bookhub.backend.config;

import com.bookhub.backend.api.service.NotificationService;
import com.bookhub.backend.domain.booking.Appointment;
import com.bookhub.backend.domain.booking.AppointmentRepository;
import com.bookhub.backend.domain.booking.AppointmentStatus;
import com.bookhub.backend.domain.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Scheduled job to auto-complete appointments that have passed their end time.
 * If no issues were reported (no-show, cancellation), the appointment is
 * automatically marked as COMPLETED after its scheduled end time.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentAutoCompleteJob {

    private static final DateTimeFormatter NOTIFICATION_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

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
                notifyCompletedAppointment(appointment);
                count++;
            }

            log.info("Auto-completed {} past appointments", count);
        } catch (Exception e) {
            log.error("Error auto-completing past appointments", e);
        }
    }

    private void notifyCompletedAppointment(Appointment appointment) {
        Set<Long> recipients = new LinkedHashSet<>();
        recipients.add(appointment.getClient().getId());
        recipients.add(appointment.getWorker().getUser().getId());
        recipients.add(appointment.getWorker().getBusiness().getOwner().getId());

        notificationService.createNotificationForUsers(
                recipients,
                "Cita completada",
                String.format(
                        "La cita de %s del %s fue marcada como completada automaticamente.",
                        appointment.getService().getName(),
                        appointment.getEndTime().format(NOTIFICATION_DATE_FORMAT)
                ),
                NotificationType.APPOINTMENT_STATUS_UPDATED,
                "APPOINTMENT",
                appointment.getId()
        );
    }
}
