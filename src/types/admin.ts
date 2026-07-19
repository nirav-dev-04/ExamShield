export interface ExamAnalyticsDTO {
  totalAttempts: number;
  averageScore: number;
  passPercentage: number;
  ranks: RankEntryDTO[];
}

export interface RankEntryDTO {
  studentName: string;
  score: number;
  rank: number;
}

export interface AdminQuestionResponseDTO {
  id: number;
  topicId: number | null;
  topicName: string | null;
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
