package com.bookhub.backend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiter service using Bucket4j.
 * Provides protection against brute force attacks on authentication endpoints.
 */
@Component
public class RateLimitService {

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> passwordResetBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.login.requests:5}")
    private int loginMaxRequests;

    @Value("${app.rate-limit.login.duration-minutes:15}")
    private int loginDurationMinutes;

    @Value("${app.rate-limit.password-reset.requests:3}")
    private int passwordResetMaxRequests;

    @Value("${app.rate-limit.password-reset.duration-minutes:60}")
    private int passwordResetDurationMinutes;

    @Value("${app.rate-limit.general.requests:100}")
    private int generalMaxRequests;

    @Value("${app.rate-limit.general.duration-minutes:1}")
    private int generalDurationMinutes;

    /**
     * Check if a login attempt is allowed for the given key (IP or email).
     * @param key The identifier (IP address or email)
     * @return true if the request is allowed, false if rate limited
     */
    public boolean tryConsumeLogin(String key) {
        return getBucket(loginBuckets, key, loginMaxRequests, loginDurationMinutes).tryConsume(1);
    }

    /**
     * Check if a password reset attempt is allowed for the given key.
     * @param key The identifier (IP address or email)
     * @return true if the request is allowed, false if rate limited
     */
    public boolean tryConsumePasswordReset(String key) {
        return getBucket(passwordResetBuckets, key, passwordResetMaxRequests, passwordResetDurationMinutes).tryConsume(1);
    }

    /**
     * Check if a general API request is allowed for the given key.
     * @param key The identifier (IP address)
     * @return true if the request is allowed, false if rate limited
     */
    public boolean tryConsumeGeneral(String key) {
        return getBucket(generalBuckets, key, generalMaxRequests, generalDurationMinutes).tryConsume(1);
    }

    /**
     * Get remaining tokens for login bucket.
     */
    public long getLoginRemainingTokens(String key) {
        return getBucket(loginBuckets, key, loginMaxRequests, loginDurationMinutes)
                .getAvailableTokens();
    }

    /**
     * Reset the rate limit for a specific key (e.g., after successful login).
     */
    public void resetLoginLimit(String key) {
        loginBuckets.remove(key);
    }

    private Bucket getBucket(Map<String, Bucket> buckets, String key, int maxRequests, int durationMinutes) {
        return buckets.computeIfAbsent(key, k -> createBucket(maxRequests, durationMinutes));
    }

    private Bucket createBucket(int maxRequests, int durationMinutes) {
        Bandwidth limit = Bandwidth.classic(
                maxRequests,
                Refill.intervally(maxRequests, Duration.ofMinutes(durationMinutes))
        );
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Clean up expired buckets every 30 minutes to prevent memory leaks.
     */
    @Scheduled(fixedRate = 1800000) // 30 minutes
    public void cleanupExpiredBuckets() {
        // Simple cleanup - remove buckets that have recovered to full capacity
        // This prevents memory leaks from accumulating buckets
        loginBuckets.entrySet().removeIf(entry -> 
                entry.getValue().getAvailableTokens() >= loginMaxRequests);
        passwordResetBuckets.entrySet().removeIf(entry -> 
                entry.getValue().getAvailableTokens() >= passwordResetMaxRequests);
        generalBuckets.entrySet().removeIf(entry -> 
                entry.getValue().getAvailableTokens() >= generalMaxRequests);
    }
}
