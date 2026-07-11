# ExamShield Backend API Contract Reference

This document outlines the exact endpoints, request methods, and JSON payloads exposed by the Spring Boot backend, serving as the source of truth for the standalone mock layer.

---

## 1. Authentication API (`/api/auth`)

### Register User
* **Method**: `POST`
* **Path**: `/api/auth/register`
* **Response**: `200 OK`
  ```json
  {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@student.com",
    "role": "STUDENT",
    "enrollmentNo": "EN98982",
    "isActive": true
  }
  ```

### Login User
* **Method**: `POST`
* **Path**: `/api/auth/login`
* **Response**: `200 OK` (Sets HTTPOnly cookie `jwt` and readable cookie `XSRF-TOKEN`)
  ```json
  {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@student.com",
    "role": "STUDENT",
    "enrollmentNo": "EN98982",
    "isActive": true
  }
  ```

### Get Current User Session
* **Method**: `GET`
* **Path**: `/api/auth/me`
* **Response**: `200 OK`
  ```json
  {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@student.com",
    "role": "STUDENT",
    "enrollmentNo": "EN98982",
    "isActive": true
  }
  ```
* **Failure Response**: `401 Unauthorized`
  ```json
  {
    "message": "Not authenticated"
  }
  ```

---

## 2. Student Examination API (`/api/student`)

### Get Published Exams
* **Method**: `GET`
* **Path**: `/api/student/exams`
* **Response**: `200 OK`
  ```json
  [
    {
      "id": 10,
      "title": "Database Systems Final",
      "startTime": "2026-07-11T12:00:00",
      "endTime": "2026-07-11T15:00:00",
      "durationMinutes": 60,
      "totalQuestions": 3,
      "easyCount": 1,
      "mediumCount": 1,
      "hardCount": 1,
      "passingMarks": 4,
      "lateEntryMinutes": 10,
      "maxViolations": 3,
      "isSectioned": false,
      "isPublished": true,
      "createdAt": "2026-07-11T10:00:00"
    }
  ]
  ```

### Start or Resume Exam Attempt
* **Method**: `POST`
* **Path**: `/api/student/exams/{examId}/start`
* **Response**: `200 OK`
  ```json
  {
    "id": 45,
    "examId": 10,
    "examTitle": "Database Systems Final",
    "studentName": "John Doe",
    "status": "IN_PROGRESS",
    "startedAt": "2026-07-11T12:05:00",
    "durationMinutes": 60,
    "remainingSeconds": 3600,
    "violationsCount": 0,
    "questions": [
      {
        "id": 101,
        "topicId": 1,
        "topicName": "Relational Theory",
        "type": "MCQ",
        "questionText": "What does SQL stand for?",
        "optionA": "Structured Query Language",
        "optionB": "Simple Query Language",
        "optionC": "Standard Query Language",
        "optionD": "System Query Language",
        "difficulty": "EASY",
        "marks": 2,
        "sequenceOrder": 1
      },
      {
        "id": 102,
        "topicId": 1,
        "topicName": "Transactions",
        "type": "TRUE_FALSE",
        "questionText": "Database transactions must satisfy ACID properties.",
        "optionA": "True",
        "optionB": "False",
        "optionC": null,
        "optionD": null,
        "difficulty": "MEDIUM",
        "marks": 2,
        "sequenceOrder": 2
      },
      {
        "id": 103,
        "topicId": 2,
        "topicName": "Storage Systems",
        "type": "SUBJECTIVE",
        "questionText": "Compare relational databases and document stores.",
        "optionA": null,
        "optionB": null,
        "optionC": null,
        "optionD": null,
        "difficulty": "HARD",
        "marks": 6,
        "sequenceOrder": 3
      }
    ]
  }
  ```

### Autosave Answer
* **Method**: `POST`
* **Path**: `/api/student/attempts/{attemptId}/answer`
* **Request Body**:
  ```json
  {
    "questionId": 101,
    "studentAnswer": "A"
  }
  ```
* **Response**: `200 OK`
  ```json
  {
    "message": "Answer autosaved"
  }
  ```

### Get Remaining Time
* **Method**: `GET`
* **Path**: `/api/student/attempts/{attemptId}/timer`
* **Response**: `200 OK`
  ```json
  {
    "remainingSeconds": 3540
  }
  ```

### Report Exam Violation
* **Method**: `POST`
* **Path**: `/api/student/attempts/{attemptId}/violation`
* **Request Body**:
  ```json
  {
    "type": "TAB_SWITCH"
  }
  ```
* **Response**: `200 OK` (Corrected custom backend payload)
  ```json
  {
    "violationsCount": 1,
    "status": "IN_PROGRESS"
  }
  ```

### Submit Exam
* **Method**: `POST`
* **Path**: `/api/student/attempts/{attemptId}/submit`
* **Response**: `200 OK`
  ```json
  {
    "message": "Exam submitted successfully"
  }
  ```

---

## 3. Proctoring Dashboard API (`/api/proctor`)

### Get Live Candidate Standings
* **Method**: `GET`
* **Path**: `/api/proctor/exams/{examId}/live-students`
* **Response**: `200 OK`
  ```json
  [
    {
      "attemptId": 45,
      "studentName": "John Doe",
      "enrollmentNo": "EN98982",
      "status": "IN_PROGRESS",
      "startedAt": "2026-07-11T12:05:00",
      "violationsCount": 0
    }
  ]
  ```

### Offline Sync Violations (REST Fallback)
* **Method**: `GET`
* **Path**: `/api/proctor/exams/{examId}/violations`
* **Query Parameter**: `since` (Unix timestamp in milliseconds)
* **Response**: `200 OK`
  ```json
  [
    {
      "id": 501,
      "studentName": "John Doe",
      "enrollmentNo": "EN98982",
      "type": "TAB_SWITCH",
      "occurredAt": "2026-07-11T12:10:00",
      "attemptId": 45,
      "examId": 10
    }
  ]
  ```

### Get Subjective Grading Queue
* **Method**: `GET`
* **Path**: `/api/proctor/exams/{examId}/subjective-queue`
* **Response**: `200 OK`
  ```json
  [
    {
      "attemptQuestionId": 1001,
      "studentName": "John Doe",
      "enrollmentNo": "EN98982",
      "questionId": 103,
      "questionText": "Compare relational databases and document stores.",
      "studentAnswer": "Relational databases are structured...",
      "maxMarks": 6
    }
  ]
  ```

### Grade Subjective Answer
* **Method**: `POST`
* **Path**: `/api/proctor/attempt-questions/{id}/grade`
* **Query Parameter**: `marks` (Decimal, e.g. `5.5`)
* **Response**: `200 OK`
  ```json
  {
    "message": "Subjective question graded successfully"
  }
  ```

---

## 4. Admin Management API (`/api/admin`)

### Create Question
* **Method**: `POST`
* **Path**: `/api/admin/questions`
* **Response**: `201 Created`
  ```json
  {
    "id": 104,
    "topicId": 2,
    "topicName": "Storage Systems",
    "type": "MCQ",
    "questionText": "What index structure is commonly used in relational databases?",
    "optionA": "B+ Tree",
    "optionB": "Hash Map",
    "optionC": "Binary Search Tree",
    "optionD": "Linked List",
    "correctAnswer": "A",
    "difficulty": "MEDIUM",
    "marks": 2
  }
  ```

### Create Exam (Draft Mode)
* **Method**: `POST`
* **Path**: `/api/admin/exams`
* **Response**: `201 Created`
  ```json
  {
    "id": 11,
    "title": "Software Engineering Final Draft",
    "startTime": "2026-07-12T10:00:00",
    "endTime": "2026-07-12T13:00:00",
    "durationMinutes": 60,
    "totalQuestions": 2,
    "easyCount": 1,
    "mediumCount": 1,
    "hardCount": 0,
    "passingMarks": 2,
    "lateEntryMinutes": 10,
    "maxViolations": 3,
    "isSectioned": false,
    "isPublished": false,
    "createdAt": "2026-07-11T18:00:00"
  }
  ```

### Publish Exam
* **Method**: `POST`
* **Path**: `/api/admin/exams/{id}/publish`
* **Response**: `200 OK`
  ```json
  {
    "message": "Exam published and question pool locked successfully"
  }
  ```

### Add Question to Exam Pool
* **Method**: `POST`
* **Path**: `/api/admin/exams/{id}/questions`
* **Query Parameters**: `questionId`
* **Response**: `200 OK`
  ```json
  {
    "message": "Question successfully added to exam pool"
  }
  ```

### Get Exam Performance Analytics
* **Method**: `GET`
* **Path**: `/api/admin/exams/{id}/analytics`
* **Response**: `200 OK`
  ```json
  {
    "totalAttempts": 4,
    "averageScore": 8.0,
    "passPercentage": 75.0,
    "ranks": [
      { "studentName": "John Doe", "score": 9.5, "rank": 1 },
      { "studentName": "Jane Miller", "score": 8.0, "rank": 2 },
      { "studentName": "Bob Johnson", "score": 8.0, "rank": 2 },
      { "studentName": "Alice Smith", "score": 6.5, "rank": 4 }
    ]
  }
  ```

---

## 5. WebSockets STOMP Channels

### Proctor Live Violation Stream
* **Path**: `/topic/exam/{examId}/violations`
* **Message Payload**:
  ```json
  {
    "id": 501,
    "studentName": "John Doe",
    "enrollmentNo": "EN98982",
    "type": "TAB_SWITCH",
    "occurredAt": "2026-07-11T12:10:00",
    "attemptId": 45,
    "examId": 10
  }
  ```

### Student Private Session Status
* **Path**: `/topic/attempt/{attemptId}/status`
* **Message Payload**:
  ```json
  {
    "status": "SUSPENDED"
  }
  ```
