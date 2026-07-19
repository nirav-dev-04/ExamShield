-- Seed default users
-- All default passwords are 'ldrp@123'
-- Hash for 'ldrp@123': $2a$10$rFYriULQr1Jp8rSweP94xOaKo56irRmUqHSu27qH77FrwUVqpwnDC

INSERT INTO users (full_name, email, password_hash, role, enrollment_no, is_active)
VALUES
('Default Student', 'student@examshield.com', '$2a$10$rFYriULQr1Jp8rSweP94xOaKo56irRmUqHSu27qH77FrwUVqpwnDC', 'STUDENT', 'EN1001', TRUE);

-- Seed default topics
INSERT INTO topics (name) VALUES ('General Science'), ('Computer Science'), ('Mathematics');
