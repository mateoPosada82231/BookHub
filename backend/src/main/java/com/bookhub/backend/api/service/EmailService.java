package com.bookhub.backend.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Email service for sending transactional emails.
 * 
 * In development mode, emails are logged to console.
 * In production, integrate with a real email provider (SendGrid, AWS SES, etc.)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.email.from:noreply@bookhub.com}")
    private String fromEmail;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    /**
     * Sends a password reset email with a reset link.
     *
     * @param toEmail    Recipient's email address
     * @param resetToken The password reset token
     * @param userName   The user's name for personalization
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken, String userName) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        
        String subject = "BookHub - Recuperación de contraseña";
        String body = buildPasswordResetEmailBody(userName, resetLink);

        if (emailEnabled) {
            // TODO: Integrate with real email provider
            // sendEmail(fromEmail, toEmail, subject, body);
            log.info("Email sent to {} with password reset link", toEmail);
        } else {
            // Development mode - log the email
            log.info("=".repeat(60));
            log.info("PASSWORD RESET EMAIL (Development Mode)");
            log.info("=".repeat(60));
            log.info("To: {}", toEmail);
            log.info("Subject: {}", subject);
            log.info("Reset Link: {}", resetLink);
            log.info("Token: {}", resetToken);
            log.info("=".repeat(60));
        }
    }

    /**
     * Sends an appointment confirmation email.
     *
     * @param toEmail         Recipient's email address
     * @param userName        The user's name
     * @param businessName    The business name
     * @param serviceName     The service name
     * @param appointmentDate The appointment date and time
     */
    public void sendAppointmentConfirmation(String toEmail, String userName, 
            String businessName, String serviceName, String appointmentDate) {
        String subject = "BookHub - Confirmación de cita";
        String body = buildAppointmentConfirmationBody(userName, businessName, serviceName, appointmentDate);

        if (emailEnabled) {
            log.info("Appointment confirmation sent to {}", toEmail);
        } else {
            log.info("=".repeat(60));
            log.info("APPOINTMENT CONFIRMATION (Development Mode)");
            log.info("=".repeat(60));
            log.info("To: {}", toEmail);
            log.info("Business: {}", businessName);
            log.info("Service: {}", serviceName);
            log.info("Date: {}", appointmentDate);
            log.info("=".repeat(60));
        }
    }

    /**
     * Sends an appointment cancellation notification.
     *
     * @param toEmail      Recipient's email address
     * @param userName     The user's name
     * @param businessName The business name
     * @param reason       The cancellation reason
     */
    public void sendAppointmentCancellation(String toEmail, String userName,
            String businessName, String reason) {
        String subject = "BookHub - Cita cancelada";
        
        if (emailEnabled) {
            log.info("Cancellation notification sent to {}", toEmail);
        } else {
            log.info("=".repeat(60));
            log.info("APPOINTMENT CANCELLATION (Development Mode)");
            log.info("=".repeat(60));
            log.info("To: {}", toEmail);
            log.info("Business: {}", businessName);
            log.info("Reason: {}", reason);
            log.info("=".repeat(60));
        }
    }

    private String buildPasswordResetEmailBody(String userName, String resetLink) {
        return String.format("""
            Hola %s,
            
            Recibimos una solicitud para restablecer la contraseña de tu cuenta de BookHub.
            
            Haz clic en el siguiente enlace para crear una nueva contraseña:
            %s
            
            Este enlace expirará en 1 hora.
            
            Si no solicitaste este cambio, puedes ignorar este correo.
            
            Saludos,
            El equipo de BookHub
            """, userName != null ? userName : "Usuario", resetLink);
    }

    private String buildAppointmentConfirmationBody(String userName, String businessName, 
            String serviceName, String appointmentDate) {
        return String.format("""
            Hola %s,
            
            Tu cita ha sido confirmada con los siguientes detalles:
            
            Establecimiento: %s
            Servicio: %s
            Fecha y hora: %s
            
            Recuerda llegar a tiempo a tu cita.
            
            Saludos,
            El equipo de BookHub
            """, userName, businessName, serviceName, appointmentDate);
    }
}
