export interface ExamAttemptResponseDTO {
  id: number;
  examId: number;
  examTitle: string;
  studentName: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "SUSPENDED";
  startedAt: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: QuestionResponseDTO[];
  violationsCount: number;
}

export interface QuestionResponseDTO {
  id: number;
  topicId: number | null;
  topicName: string | null;
  type: "MCQ" | "TRUE_FALSE" | "SUBJECTIVE";
  questionText: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  sequenceOrder: number;
  studentAnswer?: string | null; // Optional UI mapping for loading answers
}
