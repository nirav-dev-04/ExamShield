-- Seed default questions for Computer Science topic (id 2)
INSERT INTO questions (topic_id, type, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks, created_by)
VALUES
(2, 'MCQ', 'Which port is default for SSL/HTTPS connection?', '80', '443', '8080', '22', 'B', 'EASY', 5, 1),
(2, 'MCQ', 'What is the main objective of SQL Injection vulnerability?', 'Executing arbitrary SQL commands on the database server', 'Sending unsolicited spam emails', 'Overloading the server with traffic', 'Decrypting local browser storage', 'A', 'EASY', 5, 1),
(2, 'SUBJECTIVE', 'Briefly define CSRF (Cross-Site Request Forgery) and explain one common mitigation method (e.g. anti-CSRF tokens).', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 10, 1);

-- Seed default exam (Vulnerability Assessment & Pen Testing)
INSERT INTO exams (title, description, start_time, end_time, duration_minutes, total_questions, easy_count, medium_count, hard_count, passing_marks, max_violations, is_published, created_by)
VALUES
('Cybersecurity Final Exam', 'Vulnerability Assessment and Penetration Testing validation check.', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '24 hours', 30, 3, 2, 1, 0, 10, 3, TRUE, 1);

-- Map questions to newly seeded exam pool
INSERT INTO exam_question_pool (exam_id, question_id)
SELECT e.id, q.id 
FROM exams e, questions q
WHERE e.title = 'Cybersecurity Final Exam'
  AND q.question_text IN (
    'Which port is default for SSL/HTTPS connection?',
    'What is the main objective of SQL Injection vulnerability?',
    'Briefly define CSRF (Cross-Site Request Forgery) and explain one common mitigation method (e.g. anti-CSRF tokens).'
  );

-- Map Default Student (student@examshield.com) to this exam
INSERT INTO exam_students (exam_id, student_id)
SELECT e.id, u.id
FROM exams e, users u
WHERE e.title = 'Cybersecurity Final Exam'
  AND u.email = 'student@examshield.com';

-- Map Default Proctor (proctor@examshield.edu) to this exam
INSERT INTO exam_proctors (exam_id, proctor_id)
SELECT e.id, u.id
FROM exams e, users u
WHERE e.title = 'Cybersecurity Final Exam'
  AND u.email = 'proctor@examshield.edu';
