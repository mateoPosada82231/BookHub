-- =====================================================
-- Notifications system
-- Version: V7
-- Description: Persistent notifications + unread tracking
-- =====================================================

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(40) NOT NULL,
    entity_type VARCHAR(60),
    entity_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
