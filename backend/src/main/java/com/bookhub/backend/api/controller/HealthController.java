package com.bookhub.backend.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Health check controller for monitoring and debugging.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "Estado del servicio")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Verifica que el servicio esté activo")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "BookHub API",
                "version", "2.0.0"));
    }
}
