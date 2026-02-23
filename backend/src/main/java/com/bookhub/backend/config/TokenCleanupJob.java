package com.bookhub.backend.config;

import com.bookhub.backend.domain.user.PasswordResetTokenRepository;
import com.bookhub.backend.domain.user.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Scheduled job to clean up expired tokens from the database.
 * Runs every 6 hours to prevent token accumulation.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TokenCleanupJob {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    /**
     * Clean up expired refresh tokens and expired/used password reset tokens.
     * Runs every 6 hours.
     */
    @Scheduled(fixedRate = 6 * 60 * 60 * 1000) // 6 hours
    @Transactional
    public void cleanExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();

        try {
            refreshTokenRepository.deleteExpiredTokens(now);
            log.info("Expired refresh tokens cleaned up");
        } catch (Exception e) {
            log.error("Error cleaning expired refresh tokens", e);
        }

        try {
            passwordResetTokenRepository.deleteExpiredAndUsedTokens(now);
            log.info("Expired/used password reset tokens cleaned up");
        } catch (Exception e) {
            log.error("Error cleaning expired password reset tokens", e);
        }
    }
}
