-- =====================================================
-- Performance Indexes
-- Version: V6
-- Description: Adds composite indexes for common search queries
-- =====================================================

-- Composite index for business search by category + city (common filter combination)
CREATE INDEX IF NOT EXISTS idx_businesses_category_city ON businesses(category, city);

-- Composite index for active businesses sorted by rating (used in default search ordering)
CREATE INDEX IF NOT EXISTS idx_businesses_active_rating ON businesses(active, average_rating DESC);

-- Composite index for appointments by status and start_time (used in agenda views)
CREATE INDEX IF NOT EXISTS idx_appointments_status_start ON appointments(status, start_time);

-- Index for worker schedules lookup by worker + day (used during booking availability check)
CREATE INDEX IF NOT EXISTS idx_worker_schedules_worker_day ON worker_schedules(worker_id, day_of_week, is_available);
