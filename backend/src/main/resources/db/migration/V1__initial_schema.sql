-- =====================================================
-- BookHub Database Schema - Initial Migration
-- Version: V1
-- Description: Creates all core tables for the platform
-- =====================================================

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'WORKER', 'CLIENT')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups (login)
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE profiles (
    id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    bio VARCHAR(500),
    phone VARCHAR(20)
);

-- =====================================================
-- BUSINESSES & SERVICES
-- =====================================================

CREATE TABLE businesses (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'BARBERSHOP', 'HAIR_SALON', 'NAIL_SALON', 'SPA',
        'CAR_WASH', 'PET_GROOMING', 'TATTOO_STUDIO', 'OTHER'
    )),
    description TEXT,
    address VARCHAR(500),
    city VARCHAR(100),
    phone VARCHAR(20),
    cover_image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    average_rating DECIMAL(2,1),
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for search by category
CREATE INDEX idx_businesses_category ON businesses(category);
-- Index for search by city
CREATE INDEX idx_businesses_city ON businesses(city);
-- Index for owner's businesses
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
-- Full text search index for name
CREATE INDEX idx_businesses_name_search ON businesses USING gin(to_tsvector('spanish', name));

-- Gallery images for businesses (many images per business)
CREATE TABLE business_images (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for business services lookup
CREATE INDEX idx_services_business ON services(business_id);

-- =====================================================
-- WORKERS
-- =====================================================

CREATE TABLE workers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    position VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- A user can only be a worker once per business
    UNIQUE(user_id, business_id)
);

-- Index for finding workers by business
CREATE INDEX idx_workers_business ON workers(business_id);
-- Index for finding businesses where a user works
CREATE INDEX idx_workers_user ON workers(user_id);

-- =====================================================
-- APPOINTMENTS / BOOKINGS
-- =====================================================

CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id BIGINT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    )),
    client_notes VARCHAR(500),
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Ensure end_time is after start_time
    CHECK (end_time > start_time)
);

-- Index for client's appointments
CREATE INDEX idx_appointments_client ON appointments(client_id);
-- Index for worker's appointments
CREATE INDEX idx_appointments_worker ON appointments(worker_id);
-- Index for finding appointments in a time range (availability)
CREATE INDEX idx_appointments_time_range ON appointments(worker_id, start_time, end_time);
-- Index for status filtering
CREATE INDEX idx_appointments_status ON appointments(status);

-- =====================================================
-- REVIEWS (Optional for future)
-- =====================================================

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE UNIQUE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- WORKER AVAILABILITY (Schedule)
-- =====================================================

CREATE TABLE worker_schedules (
    id BIGSERIAL PRIMARY KEY,
    worker_id BIGINT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    -- One schedule per day per worker
    UNIQUE(worker_id, day_of_week),
    CHECK (end_time > start_time)
);

-- =====================================================
-- REFRESH TOKENS (for JWT)
-- =====================================================

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
