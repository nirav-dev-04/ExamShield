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
    } catch (err: any) {
      console.error("Grading request failed", err);
      const errMsg = err.response?.data?.message || "Failed to submit score. Try again.";
      alert(errMsg);
    } finally {
      setSubmitting((prev) => ({ ...prev, [attemptQuestionId]: false }));
    }
  };

  return (
    <div className="layout-container" style={{ height: "100%", overflowY: "auto", padding: "2rem 3rem", scrollBehavior: "smooth" }}>
      <style>{`
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE and Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
      <header className="flat-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 className="flat-title" style={{ margin: 0 }}>Subjective Grading Panel</h1>
          <button onClick={onBack} className="btn btn-secondary" style={{ margin: 0 }}>
            Back to Live Dashboard
          </button>
        </div>
        <p className="flat-subtitle" style={{ margin: 0, marginTop: "0.5rem" }}>
          Grade subjective evaluations for exam session: {examId}
        </p>
      </header>

      {loading && <div style={{ color: "var(--fg-secondary)" }}>Loading subjective submissions...</div>}
      {error && <div style={{ color: "var(--state-danger)" }}>{error}</div>}

      {!loading && !error && queue.length === 0 && (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          padding: "4rem 2rem",
          backgroundColor: "var(--bg-secondary)", 
          borderRadius: "16px",
          border: "1px solid var(--border-subtle)",
          textAlign: "center",
          marginTop: "2rem",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.02)"
        }}>
          {/* Custom designed checkmark badge SVG illustration */}
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(30, 158, 107, 0.1)",
            color: "#1E9E6B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem"
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--fg-primary)", marginBottom: "0.75rem" }}>
            All Evaluations Complete
          </h2>
          <p style={{ 
            color: "var(--fg-secondary)", 
            fontSize: "0.95rem", 
            lineHeight: "1.6", 
            maxWidth: "500px", 
            marginBottom: "2rem" 
          }}>
            The Subjective Grading Panel lists student responses to open-ended essay questions that require manual scoring. Currently, there are no pending subjective answers awaiting grading.
          </p>
          
          <div style={{ 
            fontSize: "0.8rem", 
            color: "var(--fg-secondary)", 
            padding: "0.75rem 1.25rem", 
            backgroundColor: "rgba(255, 255, 255, 0.02)", 
            borderRadius: "8px", 
            border: "1px solid var(--border-subtle)" 
          }}>
            ℹ️ Role: Proctor evaluation queue for manual answer checking and grade publishing.
          </div>
        </div>
      )}

      {!loading && !error && queue.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "2rem" }}>
          {queue.map((item) => (
            <div 
              key={item.attemptQuestionId} 
              style={{ 
                padding: "2rem", 
                backgroundColor: "var(--bg-secondary)", 
                border: "1px solid var(--border-subtle)", 
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                display: "flex", 
                flexDirection: "column", 
                gap: "1.5rem" 
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--fg-primary)" }}>{item.studentName}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--fg-secondary)", marginTop: "0.25rem" }}>
                    Enrollment Number: <span style={{ fontWeight: 600 }}>{item.enrollmentNo}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", fontWeight: 600 }}>
                    Max Limit: {item.maxMarks} marks
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="Score"
                      style={{ 
                        width: "100px", 
                        padding: "0.5rem 0.75rem", 
                        borderRadius: "8px", 
                        border: "1px solid var(--border-subtle)",
                        textAlign: "center",
                        fontWeight: 600
                      }}
                      value={gradeValues[item.attemptQuestionId] || ""}
                      onChange={(e) => setGradeValues((prev) => ({ ...prev, [item.attemptQuestionId]: e.target.value }))}
                      disabled={submitting[item.attemptQuestionId]}
                    />
                    <button
                      onClick={() => handleGradeSubmit(item.attemptQuestionId, item.maxMarks)}
                      className="btn btn-primary"
                      style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", borderRadius: "8px" }}
                      disabled={submitting[item.attemptQuestionId] || !gradeValues[item.attemptQuestionId]}
                    >
                      {submitting[item.attemptQuestionId] ? "Grading..." : "Assign Score"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: "var(--fg-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                  Question Text
                </div>
                <p style={{ fontSize: "1rem", color: "var(--fg-primary)", marginBottom: "1.5rem", fontWeight: 500, lineHeight: "1.5" }}>
                  {item.questionText}
                </p>
                <div style={{ fontWeight: 700, color: "var(--fg-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                  Candidate Response
                </div>
                <p 
                  className="hide-scrollbar"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.02)", 
                    padding: "1.25rem", 
                    borderRadius: "10px", 
                    whiteSpace: "pre-wrap", 
                    fontSize: "0.95rem",
                    borderLeft: "4px solid var(--accent-primary)",
                    lineHeight: "1.6",
                    color: "var(--fg-primary)",
                    maxHeight: "260px",
                    overflow: "auto"
                  }}
                >
                  {item.studentAnswer || "No answer submitted."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
