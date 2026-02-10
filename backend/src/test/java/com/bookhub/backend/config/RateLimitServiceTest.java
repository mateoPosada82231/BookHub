package com.bookhub.backend.config;

import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("RateLimitService Tests")
class RateLimitServiceTest {

    private RateLimitService rateLimitService;

    @BeforeEach
    void setUp() {
        rateLimitService = new RateLimitService();
        
        // Set test configuration values
        ReflectionTestUtils.setField(rateLimitService, "loginMaxRequests", 3);
        ReflectionTestUtils.setField(rateLimitService, "loginDurationMinutes", 15);
        ReflectionTestUtils.setField(rateLimitService, "passwordResetMaxRequests", 2);
        ReflectionTestUtils.setField(rateLimitService, "passwordResetDurationMinutes", 60);
        ReflectionTestUtils.setField(rateLimitService, "generalMaxRequests", 10);
        ReflectionTestUtils.setField(rateLimitService, "generalDurationMinutes", 1);
    }

    @Test
    @DisplayName("Should allow login attempts within limit")
    void tryConsumeLogin_shouldAllowWithinLimit() {
        String key = "192.168.1.1:user@test.com";

        // First 3 attempts should succeed
        assertThat(rateLimitService.tryConsumeLogin(key)).isTrue();
        assertThat(rateLimitService.tryConsumeLogin(key)).isTrue();
        assertThat(rateLimitService.tryConsumeLogin(key)).isTrue();

        // 4th attempt should be blocked
        assertThat(rateLimitService.tryConsumeLogin(key)).isFalse();
    }

    @Test
    @DisplayName("Should block login attempts when limit exceeded")
    void tryConsumeLogin_shouldBlockWhenLimitExceeded() {
        String key = "192.168.1.2:user@test.com";

        // Exhaust all tokens
        for (int i = 0; i < 3; i++) {
            rateLimitService.tryConsumeLogin(key);
        }

        // Should be blocked now
        assertThat(rateLimitService.tryConsumeLogin(key)).isFalse();
        assertThat(rateLimitService.tryConsumeLogin(key)).isFalse();
    }

    @Test
    @DisplayName("Should allow password reset attempts within limit")
    void tryConsumePasswordReset_shouldAllowWithinLimit() {
        String key = "192.168.1.3:user@test.com";

        // First 2 attempts should succeed
        assertThat(rateLimitService.tryConsumePasswordReset(key)).isTrue();
        assertThat(rateLimitService.tryConsumePasswordReset(key)).isTrue();

        // 3rd attempt should be blocked
        assertThat(rateLimitService.tryConsumePasswordReset(key)).isFalse();
    }

    @Test
    @DisplayName("Should allow general requests within limit")
    void tryConsumeGeneral_shouldAllowWithinLimit() {
        String key = "192.168.1.4";

        // First 10 requests should succeed
        for (int i = 0; i < 10; i++) {
            assertThat(rateLimitService.tryConsumeGeneral(key)).isTrue();
        }

        // 11th request should be blocked
        assertThat(rateLimitService.tryConsumeGeneral(key)).isFalse();
    }

    @Test
    @DisplayName("Should track different keys independently")
    void rateLimits_shouldBeIndependentPerKey() {
        String key1 = "192.168.1.5:user1@test.com";
        String key2 = "192.168.1.6:user2@test.com";

        // Exhaust key1's tokens
        for (int i = 0; i < 3; i++) {
            rateLimitService.tryConsumeLogin(key1);
        }

        // key1 should be blocked
        assertThat(rateLimitService.tryConsumeLogin(key1)).isFalse();

        // key2 should still have all its tokens
        assertThat(rateLimitService.tryConsumeLogin(key2)).isTrue();
        assertThat(rateLimitService.tryConsumeLogin(key2)).isTrue();
        assertThat(rateLimitService.tryConsumeLogin(key2)).isTrue();
    }

    @Test
    @DisplayName("Should reset login limit for specific key")
    void resetLoginLimit_shouldClearBucket() {
        String key = "192.168.1.7:user@test.com";

        // Exhaust tokens
        for (int i = 0; i < 3; i++) {
            rateLimitService.tryConsumeLogin(key);
        }

        // Verify blocked
        assertThat(rateLimitService.tryConsumeLogin(key)).isFalse();

        // Reset the limit
        rateLimitService.resetLoginLimit(key);

        // Should be allowed again
        assertThat(rateLimitService.tryConsumeLogin(key)).isTrue();
    }

    @Test
    @DisplayName("Should return remaining tokens correctly")
    void getLoginRemainingTokens_shouldReturnCorrectCount() {
        String key = "192.168.1.8:user@test.com";

        assertThat(rateLimitService.getLoginRemainingTokens(key)).isEqualTo(3);

        rateLimitService.tryConsumeLogin(key);
        assertThat(rateLimitService.getLoginRemainingTokens(key)).isEqualTo(2);

        rateLimitService.tryConsumeLogin(key);
        assertThat(rateLimitService.getLoginRemainingTokens(key)).isEqualTo(1);

        rateLimitService.tryConsumeLogin(key);
        assertThat(rateLimitService.getLoginRemainingTokens(key)).isEqualTo(0);
    }
}
