import { useEffect, useState } from "react";
import { apiClient } from "../../config/axios";

interface SubjectiveGradingProps {
  examId: number;
  onBack: () => void;
}

interface SubjectiveQuestionDTO {
  attemptQuestionId: number;
  studentName: string;
  enrollmentNo: string;
  questionText: string;
  studentAnswer: string;
  maxMarks: number;
}

export function SubjectiveGrading({ examId, onBack }: SubjectiveGradingProps) {
  const [queue, setQueue] = useState<SubjectiveQuestionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradeValues, setGradeValues] = useState<{ [key: number]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: number]: boolean }>({});

  const fetchQueue = async () => {
    try {
      const response = await apiClient.get<SubjectiveQuestionDTO[]>(`/proctor/exams/${examId}/subjective-queue`);
      setQueue(response.data);
    } catch (err: any) {
      setError("Failed to fetch subjective grading queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [examId]);

  const handleGradeSubmit = async (attemptQuestionId: number, maxMarks: number) => {
    const marksString = gradeValues[attemptQuestionId];
    if (!marksString) return;
    const marks = parseFloat(marksString);
    if (isNaN(marks) || marks < 0 || marks > maxMarks) {
      alert(`Invalid grade. Must be between 0 and ${maxMarks}.`);
      return;
    }

    setSubmitting((prev) => ({ ...prev, [attemptQuestionId]: true }));
    try {
      await apiClient.post(`/proctor/attempt-questions/${attemptQuestionId}/grade`, null, {
        params: { marks }
      });
      fetchQueue();
    } catch (err) {
      console.error("Grading request failed", err);
      alert("Failed to submit score. Try again.");
    } finally {
      setSubmitting((prev) => ({ ...prev, [attemptQuestionId]: false }));
    }
  };

  return (
    <div className="layout-container">
      <header className="flat-header">
        <div>
          <h1 className="flat-title">Subjective Grading Panel</h1>
          <p className="flat-subtitle">Grade subjective evaluations for exam session: {examId}</p>
        </div>
        <button onClick={onBack} className="btn btn-secondary">
          Back to Live Dashboard
        </button>
      </header>

      {loading && <div style={{ color: "var(--fg-secondary)" }}>Loading subjective submissions...</div>}
      {error && <div style={{ color: "var(--state-danger)" }}>{error}</div>}

      {!loading && !error && queue.length === 0 && (
        <div style={{ color: "var(--fg-secondary)", padding: "2rem 0" }}>
          All subjective answers for this exam have been graded!
        </div>
      )}

      {!loading && !error && queue.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {queue.map((item) => (
            <div key={item.attemptQuestionId} style={{ padding: "1.5rem 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "1rem" }}>{item.studentName}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", marginLeft: "0.75rem" }}>
                    Enrollment: {item.enrollmentNo}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--fg-secondary)" }}>
                    Max: {item.maxMarks} marks
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="Enter marks"
                    style={{ width: "120px", padding: "0.4rem 0.75rem" }}
                    value={gradeValues[item.attemptQuestionId] || ""}
                    onChange={(e) => setGradeValues((prev) => ({ ...prev, [item.attemptQuestionId]: e.target.value }))}
                    disabled={submitting[item.attemptQuestionId]}
                  />
                  <button
                    onClick={() => handleGradeSubmit(item.attemptQuestionId, item.maxMarks)}
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                    disabled={submitting[item.attemptQuestionId] || !gradeValues[item.attemptQuestionId]}
                  >
                    {submitting[item.attemptQuestionId] ? "Grading..." : "Submit Grade"}
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: "var(--fg-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  QUESTION
                </div>
                <p style={{ fontSize: "0.95rem", color: "var(--fg-primary)", marginBottom: "1rem" }}>
                  {item.questionText}
                </p>
                <div style={{ fontWeight: 600, color: "var(--fg-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  SUBMISSION
                </div>
                <p style={{ 
                  backgroundColor: "var(--bg-secondary)", 
                  padding: "1rem", 
                  borderRadius: "4px", 
                  whiteSpace: "pre-wrap", 
                  fontSize: "0.95rem",
                  borderLeft: "3px solid var(--accent-primary)"
                }}>
                  {item.studentAnswer}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
