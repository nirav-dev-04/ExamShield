export interface LiveCandidateDTO {
  attemptId: number;
  studentName: string;
  enrollmentNo: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "SUSPENDED";
  startedAt: string;
  violationsCount: number;
}

export interface ViolationResponseDTO {
  id: number;
  attemptId: number;
  examId: number;
  studentName: string;
  enrollmentNo: string;
  type: "TAB_SWITCH" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "COPY" | "PASTE";
  occurredAt: string;
}

export interface ViolationReportResponseDTO {
  violationsCount: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "SUSPENDED";
}
