package com.bookhub.backend.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Cache configuration.
 * Uses Caffeine as the cache provider with settings defined in application.yml.
 *
 * Cache names:
 * - businesses: Business search results and summaries (5 min TTL)
 * - business-detail: Full business detail by ID (5 min TTL)
 * - worker-schedules: Worker schedules (5 min TTL)
 */
@Configuration
@EnableCaching
public class CacheConfig {
}
