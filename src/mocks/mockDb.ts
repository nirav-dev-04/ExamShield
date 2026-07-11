import type { UserResponseDTO } from "../types/auth";
import type { Exam } from "../types/exam";

// Define the shape of our mock DB schema
export interface MockUser extends UserResponseDTO {
  passwordHash: string;
}

export interface MockAttempt {
  id: number;
  examId: number;
  studentId: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "SUSPENDED";
  startedAt: string;
  durationMinutes: number;
  remainingSeconds: number;
  violationsCount: number;
  answers: { [questionId: number]: string };
  questionSequence: number[]; // Ordered list of question IDs
  grades: { [questionId: number]: number }; // Marks awarded
  submittedAt: string | null;
  totalScore: number | null;
  rank: number | null;
}

export interface MockQuestion {
  id: number;
  topicId: number;
  topicName: string;
  type: "MCQ" | "TRUE_FALSE" | "SUBJECTIVE";
  questionText: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
}

export interface MockViolation {
  id: number;
  attemptId: number;
  examId: number;
  studentName: string;
  enrollmentNo: string;
  type: string;
  occurredAt: string;
}

// Initial Mock Seeding Data
const DEFAULT_USERS: MockUser[] = [
  {
    id: 1,
    fullName: "John Doe",
    email: "john@student.com",
    role: "STUDENT",
    enrollmentNo: "EN98982",
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordHash: "Password123!"
  },
  {
    id: 2,
    fullName: "Jane Smith",
    email: "jane@proctor.com",
    role: "PROCTOR",
    enrollmentNo: "PR77881",
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordHash: "Password123!"
  },
  {
    id: 3,
    fullName: "Admin User",
    email: "admin@admin.com",
    role: "ADMIN",
    enrollmentNo: "AD11223",
    isActive: true,
    createdAt: new Date().toISOString(),
    passwordHash: "Password123!"
  }
];

const DEFAULT_EXAMS: Exam[] = [
  {
    id: 10,
    title: "Database Systems Final",
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    endTime: new Date(Date.now() + 86400000).toISOString(),  // Tomorrow
    durationMinutes: 60,
    totalQuestions: 3,
    easyCount: 1,
    mediumCount: 1,
    hardCount: 1,
    passingMarks: 4,
    lateEntryMinutes: 10,
    maxViolations: 3,
    isSectioned: false,
    isPublished: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_QUESTIONS: MockQuestion[] = [
  {
    id: 101,
    topicId: 1,
    topicName: "Relational Theory",
    type: "MCQ",
    questionText: "What does SQL stand for?",
    optionA: "Structured Query Language",
    optionB: "Simple Query Language",
    optionC: "Standard Query Language",
    optionD: "System Query Language",
    correctAnswer: "A",
    difficulty: "EASY",
    marks: 2
  },
  {
    id: 102,
    topicId: 1,
    topicName: "Transactions",
    type: "TRUE_FALSE",
    questionText: "Database transactions must satisfy ACID properties.",
    optionA: "True",
    optionB: "False",
    optionC: null,
    optionD: null,
    correctAnswer: "A",
    difficulty: "MEDIUM",
    marks: 2
  },
  {
    id: 103,
    topicId: 2,
    topicName: "Storage Systems",
    type: "SUBJECTIVE",
    questionText: "Compare relational databases and document stores.",
    optionA: null,
    optionB: null,
    optionC: null,
    optionD: null,
    correctAnswer: null,
    difficulty: "HARD",
    marks: 6
  }
];

// Database operations class
class MockDatabase {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem("examshield_users")) {
      localStorage.setItem("examshield_users", JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem("examshield_exams")) {
      localStorage.setItem("examshield_exams", JSON.stringify(DEFAULT_EXAMS));
    }
    if (!localStorage.getItem("examshield_questions")) {
      localStorage.setItem("examshield_questions", JSON.stringify(DEFAULT_QUESTIONS));
    }
    if (!localStorage.getItem("examshield_attempts")) {
      localStorage.setItem("examshield_attempts", JSON.stringify([]));
    }
    if (!localStorage.getItem("examshield_violations")) {
      localStorage.setItem("examshield_violations", JSON.stringify([]));
    }
  }

  // Getters
  getUsers(): MockUser[] {
    return JSON.parse(localStorage.getItem("examshield_users") || "[]");
  }

  getExams(): Exam[] {
    return JSON.parse(localStorage.getItem("examshield_exams") || "[]");
  }

  getQuestions(): MockQuestion[] {
    return JSON.parse(localStorage.getItem("examshield_questions") || "[]");
  }

  getAttempts(): MockAttempt[] {
    return JSON.parse(localStorage.getItem("examshield_attempts") || "[]");
  }

  getViolations(): MockViolation[] {
    return JSON.parse(localStorage.getItem("examshield_violations") || "[]");
  }

  // Setters/mutations
  saveUsers(users: MockUser[]) {
    localStorage.setItem("examshield_users", JSON.stringify(users));
  }

  saveExams(exams: Exam[]) {
    localStorage.setItem("examshield_exams", JSON.stringify(exams));
  }

  saveQuestions(questions: MockQuestion[]) {
    localStorage.setItem("examshield_questions", JSON.stringify(questions));
  }

  saveAttempts(attempts: MockAttempt[]) {
    localStorage.setItem("examshield_attempts", JSON.stringify(attempts));
  }

  saveViolations(violations: MockViolation[]) {
    localStorage.setItem("examshield_violations", JSON.stringify(violations));
  }
}

export const mockDb = new MockDatabase();
