package com.bookhub.backend.config;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Component;

/**
 * Utility class for sanitizing user inputs to prevent XSS attacks.
 * Strips all HTML tags and scripts from text inputs.
 */
@Component
public class InputSanitizer {

    // Policy that strips ALL HTML - only allows plain text
    private static final PolicyFactory STRICT_POLICY = new HtmlPolicyBuilder().toFactory();

    /**
     * Sanitizes a string by removing all HTML tags and scripts.
     * Returns null if input is null.
     *
     * @param input the raw user input
     * @return sanitized plain text
     */
    public String sanitize(String input) {
        if (input == null) {
            return null;
        }
        return STRICT_POLICY.sanitize(input).trim();
    }

    /**
     * Sanitizes a string and ensures it's not empty after sanitization.
     * Returns null if input is null or empty after sanitization.
     *
     * @param input the raw user input
     * @return sanitized plain text, or null if empty
     */
    public String sanitizeOrNull(String input) {
        String sanitized = sanitize(input);
        return (sanitized != null && !sanitized.isBlank()) ? sanitized : null;
    }

    /**
     * Validates that a URL doesn't contain javascript: or data: schemes.
     * Returns the URL if safe, null otherwise.
     *
     * @param url the URL to validate
     * @return the URL if safe, null if potentially malicious
     */
    public String sanitizeUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim().toLowerCase();
        if (trimmed.startsWith("javascript:") || 
            trimmed.startsWith("data:") ||
            trimmed.startsWith("vbscript:")) {
            return null;
        }
        return url.trim();
    }
}
