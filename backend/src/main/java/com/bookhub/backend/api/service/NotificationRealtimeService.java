package com.bookhub.backend.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class NotificationRealtimeService {

    private static final long SSE_TIMEOUT_MS = 30L * 60L * 1000L;

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        userEmitters.computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(error -> removeEmitter(userId, emitter));

        sendEvent(userId, "connected", Map.of("status", "connected"));
        return emitter;
    }

    public void sendNotification(Long userId, Object payload) {
        sendEvent(userId, "notification", payload);
    }

    public void sendUnreadCount(Long userId, long unreadCount) {
        sendEvent(userId, "unread_count", Map.of("unread_count", unreadCount));
    }

    public void sendHeartbeat(Long userId) {
        sendEvent(userId, "ping", Map.of("ts", System.currentTimeMillis()));
    }

    private void sendEvent(Long userId, String eventName, Object payload) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException | IllegalStateException ex) {
                removeEmitter(userId, emitter);
            }
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            userEmitters.remove(userId);
        }
    }
}
