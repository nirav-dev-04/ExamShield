-- Seed additional predefined questions to the Question Bank
INSERT INTO questions (topic_id, type, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, marks, created_by)
VALUES
(2, 'MCQ', 'Which keyword is used to define a function in Python?', 'func', 'define', 'def', 'function', 'C', 'EASY', 2, 2),
(2, 'MCQ', 'What is the output of print(2 ** 3) in Python?', '6', '8', '9', 'Error', 'B', 'MEDIUM', 3, 2),
(2, 'MCQ', 'Which HTTP method is designed to be idempotent?', 'POST', 'GET', 'PATCH', 'CONNECT', 'B', 'MEDIUM', 3, 2),
(2, 'MCQ', 'Which cryptographic algorithm is asymmetric (public-key)?', 'AES', 'DES', 'RSA', 'Blowfish', 'C', 'HARD', 5, 2),
(2, 'SUBJECTIVE', 'What is the purpose of the git clone command?', NULL, NULL, NULL, NULL, NULL, 'EASY', 5, 2),
(2, 'SUBJECTIVE', 'Explain the difference between a TCP and UDP connection.', NULL, NULL, NULL, NULL, NULL, 'MEDIUM', 10, 2);
