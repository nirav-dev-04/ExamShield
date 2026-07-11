import { mockDb } from "./mockDb";
import type { MockUser, MockViolation, MockQuestion } from "./mockDb";
import { mockStompInstance } from "./mockStomp";
import type { Exam } from "../types/exam";
import type { ExamAttemptResponseDTO, QuestionResponseDTO } from "../types/attempt";
import type { LiveCandidateDTO, ViolationResponseDTO, ViolationReportResponseDTO } from "../types/proctor";
import type { ExamAnalyticsDTO, RankEntryDTO } from "../types/admin";

const delay = () => {
  const ms = Math.floor(Math.random() * (400 - 150 + 1) + 150);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function makeErrorResponse(message: string, status = 400) {
  return {
    response: {
      status,
      data: { message }
    }
  };
}

function getCurrentUser(): MockUser | null {
  const email = localStorage.getItem("examshield_current_user");
  if (!email) return null;
  const user = mockDb.getUsers().find((u) => u.email === email);
  return user || null;
}

export const mockApiClient = {
  async get<T>(url: string, config?: any): Promise<{ data: T; status: number }> {
    await delay();
    
    // 1. GET /api/auth/me
    if (url === "/auth/me") {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw makeErrorResponse("Not authenticated", 401);
      }
      return { data: currentUser as unknown as T, status: 200 };
    }

    // 2. GET /api/student/exams
    if (url === "/student/exams") {
      const exams = mockDb.getExams();
      return { data: exams as unknown as T, status: 200 };
    }

    // 3. GET /api/student/attempts/{attemptId}/timer
    const timerMatch = url.match(/\/student\/attempts\/(\d+)\/timer/);
    if (timerMatch) {
      const attemptId = parseInt(timerMatch[1]);
      const attempts = mockDb.getAttempts();
      const attempt = attempts.find((a) => a.id === attemptId);
      if (!attempt) {
        throw makeErrorResponse("Attempt not found", 404);
      }

      // Calculate elapsed seconds since startedAt
      const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      const remaining = Math.max(0, attempt.durationMinutes * 60 - elapsed);
      
      // Update in db
      attempt.remainingSeconds = remaining;
      mockDb.saveAttempts(attempts);

      return { data: { remainingSeconds: remaining } as unknown as T, status: 200 };
    }

    // 4. GET /api/proctor/exams/{examId}/live-students
    const liveStudentsMatch = url.match(/\/proctor\/exams\/(\d+)\/live-students/);
    if (liveStudentsMatch) {
      const examId = parseInt(liveStudentsMatch[1]);
      const attempts = mockDb.getAttempts().filter((a) => a.examId === examId);
      const users = mockDb.getUsers();

      const response: LiveCandidateDTO[] = attempts.map((a) => {
        const student = users.find((u) => u.id === a.studentId);
        return {
          attemptId: a.id,
          studentName: student?.fullName || "Unknown Student",
          enrollmentNo: student?.enrollmentNo || "N/A",
          status: a.status,
          startedAt: a.startedAt,
          violationsCount: a.violationsCount
        };
      });

      return { data: response as unknown as T, status: 200 };
    }

    // 5. GET /api/proctor/exams/{examId}/violations?since=timestamp
    const proctorViolationsMatch = url.match(/\/proctor\/exams\/(\d+)\/violations/);
    if (proctorViolationsMatch) {
      const examId = parseInt(proctorViolationsMatch[1]);
      const since = config?.params?.since ? parseInt(config.params.since) : 0;
      
      const violations = mockDb.getViolations().filter(
        (v) => v.examId === examId && new Date(v.occurredAt).getTime() > since
      );

      const response: ViolationResponseDTO[] = violations.map((v) => ({
        id: v.id,
        attemptId: v.attemptId,
        examId: v.examId,
        studentName: v.studentName,
        enrollmentNo: v.enrollmentNo,
        type: v.type as any,
        occurredAt: v.occurredAt
      }));

      return { data: response as unknown as T, status: 200 };
    }

    // 6. GET /api/proctor/exams/{examId}/subjective-queue
    const subjectiveQueueMatch = url.match(/\/proctor\/exams\/(\d+)\/subjective-queue/);
    if (subjectiveQueueMatch) {
      const examId = parseInt(subjectiveQueueMatch[1]);
      const attempts = mockDb.getAttempts().filter((a) => a.examId === examId);
      const questions = mockDb.getQuestions();
      const users = mockDb.getUsers();

      const response: any[] = [];
      attempts.forEach((a) => {
        const student = users.find((u) => u.id === a.studentId);
        a.questionSequence.forEach((qId) => {
          const q = questions.find((ques) => ques.id === qId);
          if (q && q.type === "SUBJECTIVE" && a.answers[qId] && a.grades[qId] === undefined) {
            response.push({
              attemptQuestionId: a.id * 1000 + q.id, // Mock composite ID matching DB relationship
              studentName: student?.fullName || "Unknown",
              enrollmentNo: student?.enrollmentNo || "N/A",
              questionId: q.id,
              questionText: q.questionText,
              studentAnswer: a.answers[qId],
              maxMarks: q.marks
            });
          }
        });
      });

      return { data: response as unknown as T, status: 200 };
    }

    // 7. GET /api/admin/exams/{id}/analytics
    const analyticsMatch = url.match(/\/admin\/exams\/(\d+)\/analytics/);
    if (analyticsMatch) {
      const examId = parseInt(analyticsMatch[1]);
      const attempts = mockDb.getAttempts().filter((a) => a.examId === examId);
      const users = mockDb.getUsers();

      if (attempts.length === 0) {
        return {
          data: {
            totalAttempts: 0,
            averageScore: 0,
            passPercentage: 0,
            ranks: []
          } as unknown as T,
          status: 200
        };
      }

      // Calculate averages and pass rates
      const scoredAttempts = attempts.filter((a) => a.totalScore !== null);
      const totalScore = scoredAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
      const averageScore = scoredAttempts.length > 0 ? totalScore / scoredAttempts.length : 0;
      
      const exams = mockDb.getExams();
      const exam = exams.find((e) => e.id === examId);
      const passing = exam?.passingMarks || 4;

      const passedCount = scoredAttempts.filter((a) => (a.totalScore || 0) >= passing).length;
      const passPercentage = scoredAttempts.length > 0 ? (passedCount / scoredAttempts.length) * 100 : 0;

      const ranks: RankEntryDTO[] = attempts.map((a) => {
        const student = users.find((u) => u.id === a.studentId);
        return {
          studentName: student?.fullName || "Unknown",
          score: a.totalScore || 0,
          rank: a.rank || 99
        };
      });

      // Sort by rank ascending
      ranks.sort((a, b) => a.rank - b.rank);

      const response: ExamAnalyticsDTO = {
        totalAttempts: attempts.length,
        averageScore,
        passPercentage,
        ranks
      };

      return { data: response as unknown as T, status: 200 };
    }

    throw makeErrorResponse("Endpoint not found", 404);
  },

  async post<T>(url: string, body?: any, config?: any): Promise<{ data: T; status: number }> {
    await delay();

    // 1. POST /api/auth/register
    if (url === "/auth/register") {
      const users = mockDb.getUsers();
      if (users.find((u) => u.email === body.email)) {
        throw makeErrorResponse("Email address already registered.");
      }

      const newUser: MockUser = {
        id: users.length + 1,
        fullName: body.fullName,
        email: body.email,
        role: body.role,
        enrollmentNo: body.enrollmentNo,
        isActive: true,
        createdAt: new Date().toISOString(),
        passwordHash: body.password
      };

      users.push(newUser);
      mockDb.saveUsers(users);

      return { data: newUser as unknown as T, status: 200 };
    }

    // 2. POST /api/auth/login
    if (url === "/auth/login") {
      const users = mockDb.getUsers();
      const user = users.find((u) => u.email === body.email && u.passwordHash === body.password);
      if (!user) {
        throw makeErrorResponse("Invalid email or password.", 401);
      }

      localStorage.setItem("examshield_current_user", user.email);
      // Mock cookie creation by saving a dummy XSRF cookie value
      document.cookie = "XSRF-TOKEN=mock_csrf_token; path=/";

      return { data: user as unknown as T, status: 200 };
    }

    // 3. POST /api/auth/logout
    if (url === "/auth/logout") {
      localStorage.removeItem("examshield_current_user");
      document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
      return { data: { message: "Logged out successfully" } as unknown as T, status: 200 };
    }

    // 4. POST /api/student/exams/{examId}/start
    const startExamMatch = url.match(/\/student\/exams\/(\d+)\/start/);
    if (startExamMatch) {
      const examId = parseInt(startExamMatch[1]);
      const exams = mockDb.getExams();
      const exam = exams.find((e) => e.id === examId);
      if (!exam) {
        throw makeErrorResponse("Exam not found", 404);
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw makeErrorResponse("Not authenticated", 401);
      }

      const attempts = mockDb.getAttempts();
      let attempt = attempts.find((a) => a.examId === examId && a.studentId === currentUser.id);

      if (attempt) {
        // If already suspended or submitted, throw DuplicateAttemptException
        if (attempt.status !== "IN_PROGRESS") {
          throw makeErrorResponse("You have already submitted or were suspended from this exam.", 400);
        }
      } else {
        // Create new attempt
        const questions = mockDb.getQuestions();
        const sequence = questions.map((q) => q.id); // Simple sequence

        attempt = {
          id: attempts.length + 1,
          examId,
          studentId: currentUser.id,
          status: "IN_PROGRESS",
          startedAt: new Date().toISOString(),
          durationMinutes: exam.durationMinutes,
          remainingSeconds: exam.durationMinutes * 60,
          violationsCount: 0,
          answers: {},
          questionSequence: sequence,
          grades: {},
          submittedAt: null,
          totalScore: null,
          rank: null
        };
        attempts.push(attempt);
        mockDb.saveAttempts(attempts);
      }

      // Map questions to QuestionResponseDTO
      const questionsList = mockDb.getQuestions();
      const attemptQuestions: QuestionResponseDTO[] = attempt.questionSequence.map((qId, idx) => {
        const q = questionsList.find((ques) => ques.id === qId)!;
        return {
          id: q.id,
          topicId: q.topicId,
          topicName: q.topicName,
          type: q.type,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          difficulty: q.difficulty,
          marks: q.marks,
          sequenceOrder: idx + 1,
          studentAnswer: attempt!.answers[qId] || null
        };
      });

      const response: ExamAttemptResponseDTO = {
        id: attempt.id,
        examId: attempt.examId,
        examTitle: exam.title,
        studentName: currentUser.fullName,
        status: attempt.status,
        startedAt: attempt.startedAt,
        durationMinutes: attempt.durationMinutes,
        remainingSeconds: attempt.remainingSeconds,
        questions: attemptQuestions,
        violationsCount: attempt.violationsCount
      };

      return { data: response as unknown as T, status: 200 };
    }

    // 5. POST /api/student/attempts/{attemptId}/answer
    const saveAnswerMatch = url.match(/\/student\/attempts\/(\d+)\/answer/);
    if (saveAnswerMatch) {
      const attemptId = parseInt(saveAnswerMatch[1]);
      const attempts = mockDb.getAttempts();
      const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
      if (attemptIndex === -1) {
        throw makeErrorResponse("Attempt not found", 404);
      }

      attempts[attemptIndex].answers[body.questionId] = body.studentAnswer;
      mockDb.saveAttempts(attempts);

      return { data: { message: "Answer autosaved" } as unknown as T, status: 200 };
    }

    // 6. POST /api/student/attempts/{attemptId}/violation
    const violationMatch = url.match(/\/student\/attempts\/(\d+)\/violation/);
    if (violationMatch) {
      const attemptId = parseInt(violationMatch[1]);
      const attempts = mockDb.getAttempts();
      const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
      if (attemptIndex === -1) {
        throw makeErrorResponse("Attempt not found", 404);
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw makeErrorResponse("Not authenticated", 401);
      }

      const attempt = attempts[attemptIndex];
      const exam = mockDb.getExams().find((e) => e.id === attempt.examId)!;

      // Add violation record
      const violations = mockDb.getViolations();
      const newViolation: MockViolation = {
        id: violations.length + 1,
        attemptId,
        examId: attempt.examId,
        studentName: currentUser.fullName,
        enrollmentNo: currentUser.enrollmentNo,
        type: body.type,
        occurredAt: new Date().toISOString()
      };
      violations.push(newViolation);
      mockDb.saveViolations(violations);

      // Increment count
      attempt.violationsCount++;

      // Trigger WebSockets broadcast to proctor monitoring channel
      const violationWsPayload: ViolationResponseDTO = {
        id: newViolation.id,
        attemptId: newViolation.attemptId,
        examId: newViolation.examId,
        studentName: newViolation.studentName,
        enrollmentNo: newViolation.enrollmentNo,
        type: newViolation.type as any,
        occurredAt: newViolation.occurredAt
      };
      mockStompInstance.publish({
        destination: `/topic/exam/${attempt.examId}/violations`,
        body: JSON.stringify(violationWsPayload)
      });

      // Auto-suspend verification
      if (attempt.violationsCount >= exam.maxViolations) {
        attempt.status = "SUSPENDED";
        attempt.submittedAt = new Date().toISOString();
        
        // Push notification lock to student screen via WebSocket
        mockStompInstance.publish({
          destination: `/topic/attempt/${attemptId}/status`,
          body: JSON.stringify({ status: "SUSPENDED" })
        });
      }

      mockDb.saveAttempts(attempts);

      const response: ViolationReportResponseDTO = {
        violationsCount: attempt.violationsCount,
        status: attempt.status
      };

      return { data: response as unknown as T, status: 200 };
    }

    // 7. POST /api/student/attempts/{attemptId}/submit
    const submitMatch = url.match(/\/student\/attempts\/(\d+)\/submit/);
    if (submitMatch) {
      const attemptId = parseInt(submitMatch[1]);
      const attempts = mockDb.getAttempts();
      const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
      if (attemptIndex === -1) {
        throw makeErrorResponse("Attempt not found", 404);
      }

      const attempt = attempts[attemptIndex];
      attempt.status = "SUBMITTED";
      attempt.submittedAt = new Date().toISOString();

      // Automatically grade MCQ/True-False questions
      const questions = mockDb.getQuestions();
      let totalScore = 0;
      let hasSubjective = false;

      attempt.questionSequence.forEach((qId) => {
        const q = questions.find((ques) => ques.id === qId);
        if (q) {
          if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
            const isCorrect = attempt.answers[qId]?.trim().toUpperCase() === q.correctAnswer?.trim().toUpperCase();
            attempt.grades[qId] = isCorrect ? q.marks : 0;
            totalScore += attempt.grades[qId];
          } else if (q.type === "SUBJECTIVE") {
            hasSubjective = true;
          }
        }
      });

      if (!hasSubjective) {
        attempt.totalScore = totalScore;
      }

      mockDb.saveAttempts(attempts);

      if (!hasSubjective) {
        recalculateRankings(attempt.examId);
      }

      return { data: { message: "Exam submitted successfully" } as unknown as T, status: 200 };
    }

    // 8. POST /api/proctor/attempt-questions/{id}/grade?marks=X
    const gradeMatch = url.match(/\/proctor\/attempt-questions\/(\d+)\/grade/);
    if (gradeMatch) {
      const idComposite = parseInt(gradeMatch[1]);
      const attemptId = Math.floor(idComposite / 1000);
      const questionId = idComposite % 1000;
      const marks = config?.params?.marks ? parseFloat(config.params.marks) : 0;

      const attempts = mockDb.getAttempts();
      const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
      if (attemptIndex === -1) {
        throw makeErrorResponse("Attempt not found", 404);
      }

      const attempt = attempts[attemptIndex];
      attempt.grades[questionId] = marks;

      // Check if all subjective questions are graded
      const questions = mockDb.getQuestions();
      let allGraded = true;
      let sumScore = 0;

      attempt.questionSequence.forEach((qId) => {
        const q = questions.find((ques) => ques.id === qId);
        if (q) {
          if (attempt.grades[qId] === undefined) {
            allGraded = false;
          } else {
            sumScore += attempt.grades[qId];
          }
        }
      });

      if (allGraded) {
        attempt.totalScore = sumScore;
      }

      mockDb.saveAttempts(attempts);

      if (allGraded) {
        recalculateRankings(attempt.examId);
      }

      return { data: { message: "Subjective question graded successfully" } as unknown as T, status: 200 };
    }

    // 9. POST /api/admin/exams
    if (url === "/admin/exams") {
      const exams = mockDb.getExams();
      const newExam: Exam = {
        id: exams.length + 11,
        title: body.title,
        startTime: body.startTime,
        endTime: body.endTime,
        durationMinutes: body.durationMinutes,
        totalQuestions: body.totalQuestions,
        easyCount: body.easyCount,
        mediumCount: body.mediumCount,
        hardCount: body.hardCount,
        passingMarks: body.passingMarks,
        lateEntryMinutes: body.lateEntryMinutes,
        maxViolations: body.maxViolations,
        isSectioned: body.isSectioned,
        isPublished: false,
        createdAt: new Date().toISOString()
      };

      exams.push(newExam);
      mockDb.saveExams(exams);

      return { data: newExam as unknown as T, status: 201 };
    }

    // 10. POST /api/admin/exams/{id}/publish
    const publishMatch = url.match(/\/admin\/exams\/(\d+)\/publish/);
    if (publishMatch) {
      const id = parseInt(publishMatch[1]);
      const exams = mockDb.getExams();
      const examIndex = exams.findIndex((e) => e.id === id);
      if (examIndex === -1) {
        throw makeErrorResponse("Exam not found", 404);
      }

      exams[examIndex].isPublished = true;
      mockDb.saveExams(exams);

      return { data: { message: "Exam published and question pool locked successfully" } as unknown as T, status: 200 };
    }

    // 11. POST /api/admin/questions
    if (url === "/admin/questions") {
      const questions = mockDb.getQuestions();
      const newQuestion: MockQuestion = {
        id: questions.length + 101,
        topicId: 1,
        topicName: body.topicName,
        type: body.type,
        questionText: body.questionText,
        optionA: body.options?.A || null,
        optionB: body.options?.B || null,
        optionC: body.options?.C || null,
        optionD: body.options?.D || null,
        correctAnswer: body.correctAnswer,
        difficulty: body.difficulty,
        marks: body.marks
      };
      
      questions.push(newQuestion);
      mockDb.saveQuestions(questions);

      return { data: newQuestion as unknown as T, status: 201 };
    }

    // 12. POST /api/admin/exams/{id}/questions
    const linkQuestionMatch = url.match(/\/admin\/exams\/(\d+)\/questions/);
    if (linkQuestionMatch) {
      return { data: { message: "Question successfully added to exam pool" } as unknown as T, status: 200 };
    }

    throw makeErrorResponse("Endpoint not found", 404);
  }
};

// standard tie-handling (competition ranking 1224)
function recalculateRankings(examId: number) {
  const attempts = mockDb.getAttempts();
  const examAttempts = attempts.filter((a) => a.examId === examId && a.totalScore !== null);

  // Sort descending by score
  examAttempts.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  let currentRank = 1;
  let lastScore: number | null = null;

  examAttempts.forEach((attempt, index) => {
    const score = attempt.totalScore || 0;
    if (lastScore === null || score !== lastScore) {
      currentRank = index + 1;
    }
    attempt.rank = currentRank;
    lastScore = score;
  });

  // Save back to list
  const updatedAttempts = attempts.map((a) => {
    const match = examAttempts.find((ea) => ea.id === a.id);
    return match ? match : a;
  });

  mockDb.saveAttempts(updatedAttempts);
}
