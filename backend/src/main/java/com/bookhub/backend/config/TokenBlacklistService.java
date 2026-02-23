package com.bookhub.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Service to blacklist JWT access tokens after logout or password change.
 * Uses an in-memory Caffeine cache with TTL matching the JWT expiration time,
 * so entries are automatically evicted once the token would have expired naturally.
 *
 * Note: This is per-instance. For multi-instance deployments, switch to Redis.
 */
@Service
@Slf4j
public class TokenBlacklistService {

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private Cache<String, Boolean> blacklist;

    @PostConstruct
    public void init() {
        this.blacklist = Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterWrite(Duration.ofMillis(jwtExpirationMs))
                .build();
        log.info("Token blacklist initialized with TTL={}ms, maxSize=10000", jwtExpirationMs);
    }

    /**
     * Blacklists a JWT token so it can no longer be used for authentication.
     */
    public void blacklist(String token) {
        if (token != null && !token.isBlank()) {
            blacklist.put(token, Boolean.TRUE);
            log.debug("Token blacklisted");
        }
    }

    /**
     * Checks whether a token has been blacklisted.
     */
    public boolean isBlacklisted(String token) {
        return blacklist.getIfPresent(token) != null;
    }
}
