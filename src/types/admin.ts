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
