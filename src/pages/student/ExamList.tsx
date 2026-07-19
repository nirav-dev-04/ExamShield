import { useEffect, useState } from "react";
import { apiClient } from "../../config/axios";
import type { Exam } from "../../types/exam";
import type { ExamAttemptResponseDTO } from "../../types/attempt";

interface ExamListProps {
  onStartExam: (examId: number) => void;
}

export function ExamList({ onStartExam }: ExamListProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<ExamAttemptResponseDTO[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "history">("available");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Exam[]>("/student/exams");
      setExams(response.data);
    } catch (err: any) {
      setError("Failed to fetch available exams.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ExamAttemptResponseDTO[]>("/student/attempts");
      setAttempts(response.data);
    } catch (err: any) {
      setError("Failed to fetch attempt history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "available") {
      fetchExams();
    } else {
      fetchAttempts();
    }
  }, [activeTab]);

  return (
    <div className="layout-container">
      <header className="flat-header" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 className="flat-title" style={{ margin: 0 }}>Student Assessment Dashboard</h1>
        </div>
        <p className="flat-subtitle" style={{ margin: 0, marginTop: "0.5rem" }}>
          Launch your assigned examinations and review evaluated outcomes
        </p>
      </header>

      {/* Policy Brief Strip */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem 1.5rem",
        borderRadius: "8px",
        backgroundColor: "var(--accent-light)",
        border: "1px solid rgba(74, 95, 247, 0.15)",
        color: "var(--accent-primary)",
        fontSize: "0.9rem",
        fontWeight: 500,
        marginBottom: "2rem"
      }}>
        <span style={{ fontSize: "1.2rem" }}>ℹ️</span>
        <div>
          <span style={{ fontWeight: 700 }}>Integrity Environment Configured</span>. Examinations run in a secure, monitored environment. Window defocus, navigation changes, and clipboard copy-paste actions are automatically flagged.
        </div>
      </div>

      {/* Premium Tab Navigation */}
      <div style={{
        display: "flex",
        gap: "1.5rem",
        marginBottom: "2rem",
        borderBottom: "1px solid var(--border-subtle)",
        paddingBottom: "0.25rem"
      }}>
        <button
          onClick={() => setActiveTab("available")}
          style={{
            background: "none",
            border: "none",
            padding: "0.5rem 0",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            color: activeTab === "available" ? "var(--accent-primary)" : "var(--fg-secondary)",
            borderBottom: activeTab === "available" ? "2px solid var(--accent-primary)" : "none",
          }}
        >
          Available Exams
        </button>
        <button
          onClick={() => setActiveTab("history")}
          style={{
            background: "none",
            border: "none",
            padding: "0.5rem 0",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            color: activeTab === "history" ? "var(--accent-primary)" : "var(--fg-secondary)",
            borderBottom: activeTab === "history" ? "2px solid var(--accent-primary)" : "none",
          }}
        >
          My Results & History
        </button>
      </div>

      {loading && <div style={{ color: "var(--fg-secondary)" }}>Loading content...</div>}
      {error && <div style={{ color: "var(--state-danger)" }}>{error}</div>}

      {!loading && !error && activeTab === "available" && (
        <>
          {exams.length === 0 ? (
            <div style={{ color: "var(--fg-secondary)", padding: "2rem 0" }}>
              No exams are currently active or published.
            </div>
          ) : (
            <div className="list-rows">
              <div className="flat-row" style={{ fontWeight: 600, borderBottom: "2px solid var(--border-subtle)", backgroundColor: "var(--bg-secondary)" }}>
                <span>Exam Title</span>
                <span>Duration</span>
                <span>Questions</span>
                <span style={{ textAlign: "right" }}>Action</span>
              </div>
              {exams.map((exam) => (
                <div key={exam.id} className="flat-row">
                  <span>{exam.title}</span>
                  <span>{exam.durationMinutes} minutes</span>
                  <span>{exam.totalQuestions} questions</span>
                  <span style={{ textAlign: "right" }}>
                    <button
                      onClick={() => onStartExam(exam.id)}
                      className="btn btn-primary"
                      style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                    >
                      Start
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && !error && activeTab === "history" && (
        <>
          {attempts.length === 0 ? (
            <div style={{ color: "var(--fg-secondary)", padding: "2rem 0" }}>
              You have not attempted any examinations yet.
            </div>
          ) : (
            <div className="list-rows">
              <div className="flat-row" style={{ fontWeight: 600, borderBottom: "2px solid var(--border-subtle)", backgroundColor: "var(--bg-secondary)", gridTemplateColumns: "2.5fr 2fr 1.5fr 1.5fr 1.5fr 1fr" }}>
                <span>Exam Title</span>
                <span>Started At</span>
                <span>Status</span>
                <span>Infractions</span>
                <span>Score</span>
                <span style={{ textAlign: "right" }}>Rank</span>
              </div>
              {attempts.map((attempt) => {
                const isGraded = attempt.totalScore !== null && attempt.totalScore !== undefined;
                return (
                  <div key={attempt.id} className="flat-row" style={{ gridTemplateColumns: "2.5fr 2fr 1.5fr 1.5fr 1.5fr 1fr" }}>
                    <span style={{ fontWeight: 500 }}>{attempt.examTitle}</span>
                    <span>{new Date(attempt.startedAt).toLocaleString()}</span>
                    <span>
                      <span className={`status-badge state-${attempt.status.toLowerCase()}`}>
                        {attempt.status.replace("_", " ")}
                      </span>
                    </span>
                    <span style={{ color: attempt.violationsCount > 0 ? "var(--state-danger)" : "var(--fg-secondary)" }}>
                      {attempt.violationsCount} violations
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {attempt.status === "IN_PROGRESS" ? (
                        <span style={{ color: "var(--state-warning)", fontWeight: 500 }}>In Progress</span>
                      ) : isGraded ? (
                        <span style={{ color: "var(--state-success)" }}>{attempt.totalScore} Marks</span>
                      ) : (
                        <span style={{ color: "var(--fg-secondary)", fontStyle: "italic", fontSize: "0.85rem" }}>
                          Pending Grading
                        </span>
                      )}
                    </span>
                    <span style={{ textAlign: "right", fontWeight: 600, color: "var(--accent-primary)" }}>
                      {attempt.status !== "IN_PROGRESS" && attempt.rank ? `#${attempt.rank}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
