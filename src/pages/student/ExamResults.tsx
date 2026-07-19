import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { Shield, BookOpen, BarChart2, LogOut, ChevronDown, ChevronUp, Lock, RefreshCw, FileDown, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface QuestionResponseDTO {
  id: number;
  type: "MCQ" | "TRUE_FALSE" | "SUBJECTIVE";
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  marks: number;
  sequenceOrder: number;
  studentAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
}

interface ExamAttemptResponseDTO {
  id: number;
  examId: number;
  examTitle: string;
  studentName: string;
  status: string;
  startedAt: string;
  durationMinutes: number;
  violationsCount: number;
  totalScore?: number;
  proctorNotes?: string;
  questions?: QuestionResponseDTO[];
}

export function ExamResults() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<ExamAttemptResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttemptId, setExpandedAttemptId] = useState<number | null>(null);

  const fetchAttempts = async () => {
    try {
      const response = await apiClient.get<ExamAttemptResponseDTO[]>("/student/attempts");
      setAttempts(response.data);
    } catch (e) {
      console.error("Failed to load attempts for student results page", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedAttemptId(expandedAttemptId === id ? null : id);
  };

  const downloadSessionReport = (attempt: ExamAttemptResponseDTO) => {
    const isSuspendedStr = attempt.status === "SUSPENDED";
    const dateTaken = attempt.startedAt ? new Date(attempt.startedAt).toLocaleString() : "N/A";
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ExamShield Session Report - ${attempt.examTitle}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 40px;
      background-color: #f8fafc;
    }
    .report-card {
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.03);
    }
    .header {
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #4a5ff7;
      letter-spacing: -0.5px;
    }
    .badge {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 9999px;
    }
    .badge-success { background-color: #ecfdf5; color: #059669; }
    .badge-warning { background-color: #fef3c7; color: #d97706; }
    .badge-danger { background-color: #fef2f2; color: #dc2626; }
    .title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 10px 0;
      color: #0f172a;
    }
    .meta-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 20px;
      margin-bottom: 35px;
    }
    .meta-item {
      background-color: #f8fafc;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }
    .meta-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }
    .notes-box {
      background-color: ${isSuspendedStr ? "#fef2f2" : "#f8fafc"};
      border: 1px solid ${isSuspendedStr ? "#fee2e2" : "#e2e8f0"};
      border-radius: 12px;
      padding: 16px;
      font-size: 13.5px;
      line-height: 1.5;
      color: ${isSuspendedStr ? "#991b1b" : "#334155"};
      margin-bottom: 30px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 40px;
      border-top: 1px solid #f1f5f9;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="header">
      <div class="logo">🛡️ ExamShield</div>
      <div class="badge ${isSuspendedStr ? "badge-danger" : (attempt.totalScore != null ? "badge-success" : "badge-warning")}">
        ${attempt.status}
      </div>
    </div>
    
    <h1 class="title">Academic Performance Transcript</h1>
    <p style="color: #64748b; font-size: 13px; margin: 0 0 30px 0;">Official proctor security validation and score certificate.</p>
    
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Candidate Name</div>
        <div class="meta-value">${attempt.studentName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Exam Title</div>
        <div class="meta-value">${attempt.examTitle}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Date Completed</div>
        <div class="meta-value">${dateTaken}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Score Evaluation</div>
        <div class="meta-value">${attempt.totalScore != null ? attempt.totalScore + " marks" : "Evaluation Pending"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Exam Duration</div>
        <div class="meta-value">${attempt.durationMinutes || 0} minutes</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Security Flag Count</div>
        <div class="meta-value" style="color: ${attempt.violationsCount > 0 ? "#dc2626" : "inherit"}">
          ${attempt.violationsCount} Infractions
        </div>
      </div>
    </div>
    
    <div class="section-title">Security & Proctor Audit Remarks</div>
    <div class="notes-box">
      ${isSuspendedStr 
        ? `<strong>[SUSPENSION ORDER]</strong> ${attempt.proctorNotes || "This candidate session was suspended due to exceeding the security threshold for browser infractions."}` 
        : `<strong>[PROCTOR NOTES]</strong> ${attempt.proctorNotes || "No abnormal behavior or warning indicators were flagged by the monitoring service. Session cleared."}`
      }
    </div>
    
    <div class="footer">
      Generated automatically by ExamShield Proctoring System.<br>
      Session ID: ${attempt.id} | Timestamp: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${attempt.studentName.replace(/\s+/g, "_")}_${attempt.examTitle.replace(/\s+/g, "_")}_Report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getScoreBadge = (score: number | null | undefined, status: string) => {
    if (status === "SUSPENDED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#D64545]">
          <Lock size={12} />
          Suspended
        </span>
      );
    }
    if (score == null) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          <Lock size={12} />
          Pending
        </span>
      );
    }
    if (score >= 75) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-[#1E9E6B]">
          {score}% Graded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FBF2E2] text-[#E8A33D]">
        {score}% Graded
      </span>
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-[#F8FAFC]">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#0F1B2E]">Exam Results</h2>
              <p className="text-sm text-[#5B6472]">Check your performance transcripts and proctor validations.</p>
            </div>
            <button 
              onClick={fetchAttempts}
              className="p-2 border border-[#E2E5EA] hover:bg-gray-50 rounded-lg transition-colors text-[#5B6472] flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw size={14} />
              Sync Results
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <RefreshCw size={24} className="animate-spin text-[#4A5FF7]" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="bg-white border border-[#E2E5EA] rounded-xl p-12 text-center flex flex-col items-center">
              <BarChart2 size={48} className="text-[#5B6472] opacity-40 mb-4" />
              <h3 className="text-md font-bold text-[#0F1B2E] mb-1">No completed sessions</h3>
              <p className="text-sm text-[#5B6472] max-w-sm">When you take and submit exams, your score evaluation history will show up here.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2E5EA] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#E2E5EA]">
                      <th className="py-3 px-6 text-xs font-bold text-[#5B6472] uppercase tracking-wider">Exam Name</th>
                      <th className="py-3 px-6 text-xs font-bold text-[#5B6472] uppercase tracking-wider">Date Taken</th>
                      <th className="py-3 px-6 text-xs font-bold text-[#5B6472] uppercase tracking-wider">Infractions</th>
                      <th className="py-3 px-6 text-xs font-bold text-[#5B6472] uppercase tracking-wider">Grade Status</th>
                      <th className="py-3 px-6 text-xs font-bold text-[#5B6472] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {attempts.map((attempt) => {
                      const isExpanded = expandedAttemptId === attempt.id;
                      return (
                        <div key={attempt.id} style={{ display: "contents" }}>
                          <tr 
                            onClick={() => toggleExpand(attempt.id)}
                            className="border-b border-[#E2E5EA] hover:bg-gray-50/50 cursor-pointer transition-colors"
                          >
                            <td className="py-4 px-6 font-semibold text-[#0F1B2E]">
                              {attempt.examTitle}
                            </td>
                            <td className="py-4 px-6 text-[#5B6472]">
                              {attempt.startedAt ? new Date(attempt.startedAt).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`font-semibold ${attempt.violationsCount > 0 ? "text-[#D64545]" : "text-[#5B6472]"}`}>
                                {attempt.violationsCount} flagged
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {getScoreBadge(attempt.totalScore, attempt.status)}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button className="text-[#4A5FF7] font-semibold text-xs inline-flex items-center gap-1">
                                {isExpanded ? "Collapse Details" : "View Breakdown"}
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded breakdown drawer */}
                          {isExpanded && (() => {
                            const questions = attempt.questions || [];
                            
                            let mcqTotal = 0;
                            let mcqObtained = 0;
                            let mcqCorrect = 0;
                            let mcqIncorrect = 0;
                            let mcqUnattempted = 0;
                            let mcqTotalCount = 0;
                            
                            let tfTotal = 0;
                            let tfObtained = 0;
                            let tfCorrect = 0;
                            let tfIncorrect = 0;
                            let tfUnattempted = 0;
                            let tfTotalCount = 0;
                            
                            let subTotal = 0;
                            let subObtained = 0;
                            let subTotalCount = 0;
                            let subUnattempted = 0;
                            let subGradedCount = 0;
                            
                            questions.forEach(q => {
                              const qMarks = q.marks || 0;
                              const marksAwarded = q.marksAwarded != null ? Number(q.marksAwarded) : 0;
                              
                              if (q.type === "MCQ") {
                                mcqTotalCount++;
                                mcqTotal += qMarks;
                                if (!q.studentAnswer) {
                                  mcqUnattempted++;
                                } else if (q.isCorrect) {
                                  mcqCorrect++;
                                  mcqObtained += marksAwarded;
                                } else {
                                  mcqIncorrect++;
                                }
                              } else if (q.type === "TRUE_FALSE") {
                                tfTotalCount++;
                                tfTotal += qMarks;
                                if (!q.studentAnswer) {
                                  tfUnattempted++;
                                } else if (q.isCorrect) {
                                  tfCorrect++;
                                  tfObtained += marksAwarded;
                                } else {
                                  tfIncorrect++;
                                }
                              } else if (q.type === "SUBJECTIVE") {
                                subTotalCount++;
                                subTotal += qMarks;
                                if (!q.studentAnswer) {
                                  subUnattempted++;
                                }
                                if (q.marksAwarded != null) {
                                  subObtained += marksAwarded;
                                  subGradedCount++;
                                }
                              }
                            });

                            return (
                              <tr className="bg-[#F8FAFC]">
                                <td colSpan={5} className="py-6 px-8 border-b border-[#E2E5EA]">
                                  {/* Grid of category breakdown cards */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {/* MCQ Card */}
                                    <div className="p-4 rounded-xl border border-[#E2E5EA] bg-white">
                                      <div className="text-xs font-bold text-[#5B6472] uppercase tracking-wider mb-2 flex justify-between items-center">
                                        <span>Multiple Choice (MCQ)</span>
                                        <span className="font-bold text-[#0F1B2E] text-sm">
                                          {mcqObtained} / {mcqTotal} Marks
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-[#1E9E6B]">
                                          {mcqCorrect} Correct
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-[#D64545]">
                                          {mcqIncorrect} Incorrect
                                        </span>
                                        {mcqUnattempted > 0 && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500">
                                            {mcqUnattempted} Skip
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* True/False Card */}
                                    <div className="p-4 rounded-xl border border-[#E2E5EA] bg-white">
                                      <div className="text-xs font-bold text-[#5B6472] uppercase tracking-wider mb-2 flex justify-between items-center">
                                        <span>True / False</span>
                                        <span className="font-bold text-[#0F1B2E] text-sm">
                                          {tfObtained} / {tfTotal} Marks
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-[#1E9E6B]">
                                          {tfCorrect} Correct
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-[#D64545]">
                                          {tfIncorrect} Incorrect
                                        </span>
                                        {tfUnattempted > 0 && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500">
                                            {tfUnattempted} Skip
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Subjective/Text Card */}
                                    <div className="p-4 rounded-xl border border-[#E2E5EA] bg-white">
                                      <div className="text-xs font-bold text-[#5B6472] uppercase tracking-wider mb-2 flex justify-between items-center">
                                        <span>Subjective (Text Response)</span>
                                        <span className="font-bold text-[#0F1B2E] text-sm">
                                          {subTotalCount > 0 ? (subGradedCount === subTotalCount ? `${subObtained} / ${subTotal} Marks` : "Grading In Progress") : "0 / 0 Marks"}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {subTotalCount > 0 ? (
                                          subGradedCount === subTotalCount ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-[#1E9E6B]">
                                              Fully Graded
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#FBF2E2] text-[#E8A33D]">
                                              {subGradedCount} of {subTotalCount} Evaluated
                                            </span>
                                          )
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-400">
                                            No Subjective Questions
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Performance Summary & Audit */}
                                    <div className="md:col-span-1 space-y-6">
                                      <div>
                                        <h4 className="text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-3">
                                          Performance Transcript
                                        </h4>
                                        <div className="space-y-2.5">
                                          <div className="flex justify-between text-xs py-2 border-b border-[#E2E5EA]">
                                            <span className="text-[#5B6472]">Total Marks Obtained</span>
                                            <span className="font-semibold text-[#0F1B2E]">
                                              {attempt.totalScore != null ? `${attempt.totalScore} marks` : "Evaluation Pending"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs py-2 border-b border-[#E2E5EA]">
                                            <span className="text-[#5B6472]">Duration Tracked</span>
                                            <span className="font-semibold text-[#0F1B2E]">
                                              {attempt.durationMinutes || "N/A"} mins
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs py-2 border-b border-[#E2E5EA]">
                                            <span className="text-[#5B6472]">Exam Status</span>
                                            <span className={`font-semibold ${attempt.status === "SUSPENDED" ? "text-[#D64545]" : "text-[#1E9E6B]"}`}>
                                              {attempt.status}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className={`p-5 rounded-xl border transition-all ${
                                        attempt.status === "SUSPENDED" 
                                          ? "bg-[#FEF2F2] border-[#FCA5A5]/60" 
                                          : "bg-white border-[#E2E5EA]"
                                      }`}>
                                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                                          attempt.status === "SUSPENDED" ? "text-[#991B1B]" : "text-[#0F1B2E]"
                                        }`}>
                                          🛡️ Proctor Audit Status
                                        </h4>
                                        <p className={`text-xs mb-4 leading-relaxed ${
                                          attempt.status === "SUSPENDED" ? "text-[#7F1D1D]" : "text-[#5B6472]"
                                        }`}>
                                          {attempt.status === "SUSPENDED" 
                                            ? `CRITICAL EXAM SUSPENSION: This attempt was suspended by the proctor. Reason: ${attempt.proctorNotes || "Exceeded maximum permitted browser focus violations."}`
                                            : attempt.violationsCount === 0 
                                              ? "Session cleared. No security flags or browser integrity issues were reported during this attempt."
                                              : `Security Warning: ${attempt.violationsCount} browser focus warnings were registered during this attempt.`
                                          }
                                        </p>
                                        <div className="flex gap-2">
                                          <button 
                                            onClick={() => downloadSessionReport(attempt)}
                                            className={`px-4 py-2 hover:opacity-90 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                                              attempt.status === "SUSPENDED" 
                                                ? "bg-[#DC2626] text-white" 
                                                : "bg-[#4A5FF7] text-white"
                                            }`}
                                          >
                                            <FileDown size={14} />
                                            Download Security Report
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Detailed Question Review List */}
                                    <div className="md:col-span-2">
                                      <h4 className="text-xs font-bold text-[#4A5568] uppercase tracking-wider mb-3 flex justify-between items-center">
                                        <span>Question Evaluation Log</span>
                                        <span className="text-[10px] text-gray-400 normal-case">(Scroll to view all questions)</span>
                                      </h4>
                                      {questions.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-[#5B6472] bg-white border border-[#E2E5EA] rounded-xl">
                                          No question details available.
                                        </div>
                                      ) : (
                                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 hide-scrollbar">
                                          {questions.map((q, qidx) => {
                                            const hasSubmitted = !!q.studentAnswer;
                                            return (
                                              <div 
                                                key={q.id}
                                                className="p-4 rounded-xl border border-[#E2E5EA] bg-white flex flex-col gap-2.5 transition-all hover:border-[#CBD5E1]"
                                              >
                                                <div className="flex justify-between items-start gap-4">
                                                  <div className="text-xs font-bold text-[#5B6472]">
                                                    Q{qidx + 1}. <span className="font-semibold text-[#0F1B2E] ml-1">{q.questionText}</span>
                                                  </div>
                                                  <span className="text-xs font-semibold text-[#5B6472] bg-[#F1F5F9] px-2 py-0.5 rounded whitespace-nowrap">
                                                    {q.marksAwarded != null ? `${q.marksAwarded} / ` : ""}{q.marks} Marks
                                                  </span>
                                                </div>

                                                <div className="text-xs space-y-1.5 pl-6 border-l-2 border-[#E2E5EA]">
                                                  {/* Student Answer */}
                                                  <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-[#5B6472] font-semibold">Your Answer:</span>
                                                    {q.type === "SUBJECTIVE" ? (
                                                      <span className="text-[#0F1B2E] italic break-all">
                                                        {q.studentAnswer || "No response submitted."}
                                                      </span>
                                                    ) : (
                                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                                                        !hasSubmitted 
                                                          ? "bg-gray-100 text-gray-500" 
                                                          : q.isCorrect 
                                                            ? "bg-green-50 text-[#1E9E6B]" 
                                                            : "bg-red-50 text-[#D64545]"
                                                      }`}>
                                                        {hasSubmitted ? (
                                                          <>
                                                            {q.isCorrect ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                            {q.studentAnswer}
                                                          </>
                                                        ) : (
                                                          "Unattempted"
                                                        )}
                                                      </span>
                                                    )}
                                                  </div>

                                                  {/* Correct Answer (Show only if MCQ or TRUE_FALSE) */}
                                                  {q.type !== "SUBJECTIVE" && (
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="text-[#5B6472] font-semibold">Correct Answer:</span>
                                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold bg-green-50 text-[#1E9E6B]">
                                                        {q.correctAnswer}
                                                      </span>
                                                    </div>
                                                  )}

                                                  {/* Subjective status detail */}
                                                  {q.type === "SUBJECTIVE" && (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                      <span className="text-[#5B6472] font-semibold">Status:</span>
                                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                                                        q.marksAwarded != null 
                                                          ? "bg-green-50 text-[#1E9E6B]" 
                                                          : "bg-[#FBF2E2] text-[#E8A33D]"
                                                      }`}>
                                                        {q.marksAwarded != null ? "Graded" : "Evaluation Pending"}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="bg-[#F7F8FA] border-t border-[#E2E5EA] px-6 py-3.5 flex justify-between items-center text-xs text-[#5B6472]">
                <span>Showing 1-{attempts.length} of {attempts.length} exams</span>
                <div className="flex gap-1.5">
                  <button className="px-3 py-1 bg-white border border-[#E2E5EA] rounded cursor-not-allowed opacity-50 font-semibold">Prev</button>
                  <button className="px-3 py-1 bg-white border border-[#E2E5EA] rounded cursor-not-allowed opacity-50 font-semibold">Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

