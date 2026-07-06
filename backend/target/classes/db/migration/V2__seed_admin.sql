-- Seed default users
-- All default passwords are 'admin123' except for student which is 'student123'
-- Hash for 'admin123': $2b$10$d1AO.//JK74oRdGf58jBK.N1JHLUzrFwNja3UUWN0nZW/nF4U8h66
-- Hash for 'student123': $2b$10$hClZLZpmnS9A/AlDk2oWAuKfa8q91nmq5frN/15oEgkiFqVVChUSC

INSERT INTO users (full_name, email, password_hash, role, enrollment_no, is_active)
VALUES
('Super Admin', 'superadmin@examshield.com', '$2b$10$d1AO.//JK74oRdGf58jBK.N1JHLUzrFwNja3UUWN0nZW/nF4U8h66', 'SUPER_ADMIN', NULL, TRUE),
('Default Admin', 'admin@examshield.com', '$2b$10$d1AO.//JK74oRdGf58jBK.N1JHLUzrFwNja3UUWN0nZW/nF4U8h66', 'ADMIN', NULL, TRUE),
('Default Proctor', 'proctor@examshield.com', '$2b$10$d1AO.//JK74oRdGf58jBK.N1JHLUzrFwNja3UUWN0nZW/nF4U8h66', 'PROCTOR', NULL, TRUE),
('Default Student', 'student@examshield.com', '$2b$10$hClZLZpmnS9A/AlDk2oWAuKfa8q91nmq5frN/15oEgkiFqVVChUSC', 'STUDENT', 'EN1001', TRUE);

-- Seed default topics
INSERT INTO topics (name) VALUES ('General Science'), ('Computer Science'), ('Mathematics');
