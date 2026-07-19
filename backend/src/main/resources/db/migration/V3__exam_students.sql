-- ===================== EXAM STUDENTS RELATION =====================
CREATE TABLE exam_students (
    exam_id     BIGINT REFERENCES exams(id) ON DELETE CASCADE,
    student_id  BIGINT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, student_id)
);
