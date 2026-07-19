-- Remove old topics: General Science, Computer Science, and Mathematics
DELETE FROM attempt_questions WHERE question_id IN (SELECT id FROM questions WHERE topic_id IN (SELECT id FROM topics WHERE name IN ('General Science', 'Computer Science', 'Mathematics')));
DELETE FROM exam_question_pool WHERE question_id IN (SELECT id FROM questions WHERE topic_id IN (SELECT id FROM topics WHERE name IN ('General Science', 'Computer Science', 'Mathematics')));
DELETE FROM questions WHERE topic_id IN (SELECT id FROM topics WHERE name IN ('General Science', 'Computer Science', 'Mathematics'));

DELETE FROM topics WHERE name IN ('General Science', 'Computer Science', 'Mathematics');
