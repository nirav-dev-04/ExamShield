-- ===================== USERS & ROLES =====================
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('SUPER_ADMIN','ADMIN','PROCTOR','STUDENT')),
    enrollment_no   VARCHAR(50),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ===================== QUESTION BANK =====================
CREATE TABLE topics (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE questions (
    id              BIGSERIAL PRIMARY KEY,
    topic_id        BIGINT REFERENCES topics(id) ON DELETE SET NULL,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('MCQ','TRUE_FALSE','SUBJECTIVE')),
    question_text   TEXT NOT NULL,
    option_a        TEXT,
    option_b        TEXT,
    option_c        TEXT,
    option_d        TEXT,
    correct_answer  VARCHAR(10),
    difficulty      VARCHAR(10) NOT NULL CHECK (difficulty IN ('EASY','MEDIUM','HARD')),
    marks           INT NOT NULL DEFAULT 1,
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ===================== EXAM =====================
CREATE TABLE exams (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    start_time          TIMESTAMP NOT NULL,
    end_time            TIMESTAMP NOT NULL,
    late_entry_minutes  INT DEFAULT 10,
    duration_minutes    INT NOT NULL,
    total_questions     INT NOT NULL,
    easy_count          INT DEFAULT 0,
    medium_count        INT DEFAULT 0,
    hard_count          INT DEFAULT 0,
    passing_marks       INT NOT NULL,
    max_violations      INT DEFAULT 3,
    is_sectioned        BOOLEAN DEFAULT FALSE,
    is_published        BOOLEAN DEFAULT FALSE,
    created_by          BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_sections (
    id              BIGSERIAL PRIMARY KEY,
    exam_id         BIGINT REFERENCES exams(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    question_count  INT NOT NULL,
    duration_minutes INT
);

CREATE TABLE exam_question_pool (
    id              BIGSERIAL PRIMARY KEY,
    exam_id         BIGINT REFERENCES exams(id) ON DELETE CASCADE,
    section_id      BIGINT REFERENCES exam_sections(id) ON DELETE SET NULL,
    question_id     BIGINT REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE exam_proctors (
    exam_id     BIGINT REFERENCES exams(id) ON DELETE CASCADE,
    proctor_id  BIGINT REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, proctor_id)
);

-- ===================== ATTEMPTS =====================
CREATE TABLE exam_attempts (
    id              BIGSERIAL PRIMARY KEY,
    exam_id         BIGINT REFERENCES exams(id) ON DELETE CASCADE,
    student_id      BIGINT REFERENCES users(id) ON DELETE CASCADE,
    seed            VARCHAR(50) NOT NULL,
    status          VARCHAR(20) DEFAULT 'IN_PROGRESS'
                        CHECK (status IN ('IN_PROGRESS','SUBMITTED','SUSPENDED','AUTO_SUBMITTED')),
    started_at      TIMESTAMP DEFAULT NOW(),
    submitted_at    TIMESTAMP,
    total_score     NUMERIC(6,2),
    rank            INT,
    UNIQUE (exam_id, student_id)
);

CREATE TABLE attempt_questions (
    id              BIGSERIAL PRIMARY KEY,
    attempt_id      BIGINT REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id     BIGINT REFERENCES questions(id) ON DELETE CASCADE,
    sequence_order  INT NOT NULL,
    student_answer  TEXT,
    is_correct      BOOLEAN,
    marks_awarded   NUMERIC(5,2),
    graded_by       BIGINT REFERENCES users(id) ON DELETE SET NULL,
    graded_at       TIMESTAMP
);

-- ===================== VIOLATIONS =====================
CREATE TABLE violations (
    id              BIGSERIAL PRIMARY KEY,
    attempt_id      BIGINT REFERENCES exam_attempts(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL CHECK (type IN
                        ('TAB_SWITCH','WINDOW_BLUR','COPY','PASTE','RIGHT_CLICK')),
    occurred_at     TIMESTAMP DEFAULT NOW()
);

-- ===================== AUDIT LOG =====================
CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   BIGINT,
    details     JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ===================== INDEXING =====================
CREATE INDEX idx_attempt_questions_attempt_id ON attempt_questions(attempt_id);
CREATE INDEX idx_violations_attempt_id ON violations(attempt_id, occurred_at);
CREATE INDEX idx_questions_topic_id ON questions(topic_id, difficulty);
CREATE INDEX idx_exam_question_pool_exam_id ON exam_question_pool(exam_id);
