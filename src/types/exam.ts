export interface Exam {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalQuestions: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  passingMarks: number;
  lateEntryMinutes: number;
  maxViolations: number;
  isSectioned: boolean;
  isPublished: boolean;
  createdAt: string;
}
