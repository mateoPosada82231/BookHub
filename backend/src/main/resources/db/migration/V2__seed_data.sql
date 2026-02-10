-- =====================================================
-- BookHub Seed Data
-- Version: V2
-- Description: Initial test data for development
-- =====================================================

-- =====================================================
-- USERS (passwords are bcrypt hash of 'password123')
-- =====================================================

-- Owner user
INSERT INTO users (email, password_hash, role) VALUES
('carlos.barbero@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQQqQXfVZQD3/P4Rn8Z9QLK5l8Wy6Hy', 'OWNER'),
('maria.spa@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQQqQXfVZQD3/P4Rn8Z9QLK5l8Wy6Hy', 'OWNER'),
('pedro.nails@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQQqQXfVZQD3/P4Rn8Z9QLK5l8Wy6Hy', 'OWNER');

-- Worker users
INSERT INTO users (email, password_hash, role) VALUES
('juan.worker@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQQqQXfVZQD3/P4Rn8Z9QLK5l8Wy6Hy', 'WORKER'),
('ana.stylist@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQQqQXfVZQD3/P4Rn8Z9QLK5l8Wy6Hy', 'WORKER');

-- Client users
INSERT INTO users (email, password_hash, role) VALUES
('cliente1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQQqQXfVZQD3/P4Rn8Z9QLK5l8Wy6Hy', 'CLIENT'),
('cliente2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQQqQXfVZQD3/P4Rn8Z9QLK5l8Wy6Hy', 'CLIENT'),
('cliente3@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQQqQXfVZQD3/P4Rn8Z9QLK5l8Wy6Hy', 'CLIENT');

-- =====================================================
-- PROFILES
-- =====================================================

INSERT INTO profiles (id, full_name, avatar_url, bio, phone) VALUES
(1, 'Carlos Rodríguez', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Barbero profesional con 10 años de experiencia', '+57 300 123 4567'),
(2, 'María González', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Especialista en tratamientos de spa y bienestar', '+57 301 234 5678'),
(3, 'Pedro Martínez', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'Artista de uñas certificado', '+57 302 345 6789'),
(4, 'Juan Pérez', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Barbero junior apasionado', '+57 303 456 7890'),
(5, 'Ana López', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'Estilista experta en colorimetría', '+57 304 567 8901'),
(6, 'Laura Sánchez', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', NULL, '+57 305 678 9012'),
(7, 'Diego Hernández', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', NULL, '+57 306 789 0123'),
(8, 'Valentina Torres', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', NULL, '+57 307 890 1234');

-- =====================================================
-- BUSINESSES
-- =====================================================

INSERT INTO businesses (owner_id, name, category, description, address, city, phone, cover_image_url, average_rating, total_reviews) VALUES
(1, 'Barbería Elite', 'BARBERSHOP', 
 'La mejor barbería de Medellín. Cortes clásicos y modernos con la mejor atención.',
 'Calle 10 #43-25, El Poblado', 'Medellín', '+57 300 123 4567',
 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
 4.9, 127),

(2, 'Spa Serenity', 'SPA',
 'Un oasis de tranquilidad en el corazón de la ciudad. Masajes, faciales y tratamientos corporales.',
 'Carrera 7 #72-41, Chapinero', 'Bogotá', '+57 301 234 5678',
 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
 4.8, 89),

(3, 'Nail Art Studio', 'NAIL_SALON',
 'Arte en tus manos. Especialistas en nail art, manicura y pedicura de lujo.',
 'Avenida 6N #23-45, Granada', 'Cali', '+57 302 345 6789',
 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800',
 4.7, 64);

-- =====================================================
-- BUSINESS IMAGES (Gallery)
-- =====================================================

INSERT INTO business_images (business_id, image_url, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600', 1),
(1, 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600', 2),
(1, 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600', 3),
(2, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600', 1),
(2, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600', 2),
(3, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600', 1),
(3, 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600', 2);

-- =====================================================
-- SERVICES
-- =====================================================

-- Barbería Elite services
INSERT INTO services (business_id, name, description, duration_minutes, price, active) VALUES
(1, 'Corte Clásico', 'Corte de cabello tradicional con tijera y máquina', 30, 25000, TRUE),
(1, 'Corte + Barba', 'Corte completo más arreglo de barba con navaja', 45, 40000, TRUE),
(1, 'Afeitado Clásico', 'Afeitado tradicional con navaja y toalla caliente', 30, 20000, TRUE),
(1, 'Tratamiento Capilar', 'Hidratación profunda y masaje capilar', 40, 35000, TRUE);

-- Spa Serenity services
INSERT INTO services (business_id, name, description, duration_minutes, price, active) VALUES
(2, 'Masaje Relajante', 'Masaje corporal completo para aliviar el estrés', 60, 80000, TRUE),
(2, 'Masaje Descontracturante', 'Masaje terapéutico para tensiones musculares', 60, 95000, TRUE),
(2, 'Facial Hidratante', 'Limpieza facial profunda con hidratación', 45, 70000, TRUE),
(2, 'Día de Spa', 'Experiencia completa: masaje, facial y exfoliación', 180, 200000, TRUE);

-- Nail Art Studio services
INSERT INTO services (business_id, name, description, duration_minutes, price, active) VALUES
(3, 'Manicura Básica', 'Limpieza, corte y esmaltado tradicional', 30, 25000, TRUE),
(3, 'Manicura Semipermanente', 'Esmaltado duradero hasta 3 semanas', 45, 45000, TRUE),
(3, 'Nail Art Diseño', 'Diseños personalizados y decoraciones', 60, 60000, TRUE),
(3, 'Pedicura Completa', 'Tratamiento completo para pies con exfoliación', 50, 40000, TRUE);

-- =====================================================
-- WORKERS
-- =====================================================

INSERT INTO workers (user_id, business_id, position, active) VALUES
(4, 1, 'Barbero Junior', TRUE),      -- Juan works at Barbería Elite
(5, 2, 'Masajista Profesional', TRUE); -- Ana works at Spa Serenity

-- Owner also works at their own businesses
INSERT INTO workers (user_id, business_id, position, active) VALUES
(1, 1, 'Barbero Principal', TRUE),   -- Carlos (owner) works at his barbershop
(2, 2, 'Terapeuta Senior', TRUE),    -- María (owner) works at her spa
(3, 3, 'Nail Artist', TRUE);         -- Pedro (owner) works at his nail salon

-- =====================================================
-- WORKER SCHEDULES
-- =====================================================

-- Carlos (worker_id=3) schedule at Barbería Elite
INSERT INTO worker_schedules (worker_id, day_of_week, start_time, end_time, is_available) VALUES
(3, 1, '09:00', '18:00', TRUE), -- Monday
(3, 2, '09:00', '18:00', TRUE), -- Tuesday
(3, 3, '09:00', '18:00', TRUE), -- Wednesday
(3, 4, '09:00', '18:00', TRUE), -- Thursday
(3, 5, '09:00', '18:00', TRUE), -- Friday
(3, 6, '10:00', '14:00', TRUE); -- Saturday

-- Juan (worker_id=1) schedule
INSERT INTO worker_schedules (worker_id, day_of_week, start_time, end_time, is_available) VALUES
(1, 1, '10:00', '19:00', TRUE),
(1, 2, '10:00', '19:00', TRUE),
(1, 3, '10:00', '19:00', TRUE),
(1, 4, '10:00', '19:00', TRUE),
(1, 5, '10:00', '19:00', TRUE);

-- =====================================================
-- SAMPLE APPOINTMENTS
-- =====================================================

INSERT INTO appointments (client_id, worker_id, service_id, start_time, end_time, status, client_notes) VALUES
-- Past appointments (completed)
(6, 3, 1, '2026-01-10 10:00:00', '2026-01-10 10:30:00', 'COMPLETED', NULL),
(7, 3, 2, '2026-01-10 11:00:00', '2026-01-10 11:45:00', 'COMPLETED', 'Barba con forma cuadrada por favor'),
(6, 4, 5, '2026-01-11 14:00:00', '2026-01-11 15:00:00', 'COMPLETED', NULL),

-- Future appointments (confirmed)
(6, 3, 1, '2026-01-20 10:00:00', '2026-01-20 10:30:00', 'CONFIRMED', NULL),
(8, 3, 2, '2026-01-20 11:00:00', '2026-01-20 11:45:00', 'PENDING', 'Primera visita'),
(7, 1, 1, '2026-01-21 15:00:00', '2026-01-21 15:30:00', 'CONFIRMED', NULL);

-- =====================================================
-- SAMPLE REVIEWS
-- =====================================================

INSERT INTO reviews (appointment_id, rating, comment) VALUES
(1, 5, 'Excelente corte, muy profesional. Definitivamente volveré!'),
(2, 5, 'El mejor lugar para arreglar la barba en Medellín.'),
(3, 4, 'Muy relajante, aunque llegaron un poco tarde.');
