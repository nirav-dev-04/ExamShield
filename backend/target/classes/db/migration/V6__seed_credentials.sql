-- Seed admin and proctor credentials for local test usage
INSERT INTO users (full_name, email, password_hash, role, enrollment_no, is_active)
VALUES
('Seeded Admin', 'admin@examshield.edu', '$2a$10$HPth4MLtKIBR3o.DidZ3F.Svxx2aHXFNSARxZDE3QcCCDo3m.yb6K', 'ADMIN', NULL, TRUE),
('Seeded Proctor', 'proctor@examshield.edu', '$2a$10$zhHLSkN0Sy6S/9cJHmc8Fu0y.fNES6dbtcQhiVcfTclnics3Qm2Cq', 'PROCTOR', NULL, TRUE);
