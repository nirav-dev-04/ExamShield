import { useEffect, useState } from "react";
import { apiClient } from "../../config/axios";
import type { ExamAttemptResponseDTO, QuestionResponseDTO } from "../../types/attempt";
import { useSecurityTracker } from "../../hooks/useSecurityTracker";
import { useAutosave } from "../../hooks/useAutosave";
import { useTimer } from "../../hooks/useTimer";
import { useWebSocket } from "../../context/WebSocketContext";

interface ExamConsoleProps {
  examId: number;
  onFinished: () => void;
}

export function ExamConsole({ examId, onFinished }: ExamConsoleProps) {
  const { stompClient } = useWebSocket();
  const [attempt, setAttempt] = useState<ExamAttemptResponseDTO | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  
  const [isSuspended, setIsSuspended] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const startAttempt = async () => {
      try {
        const response = await apiClient.post<ExamAttemptResponseDTO>(`/student/exams/${examId}/start`);
        setAttempt(response.data);
        
        const initialAnswers: { [key: number]: string } = {};
        response.data.questions.forEach((q: QuestionResponseDTO) => {
          if (q.studentAnswer) {
            initialAnswers[q.id] = q.studentAnswer;
          }
        });
        setAnswers(initialAnswers);

        if (response.data.status === "SUSPENDED") {
          setIsSuspended(true);
        } else if (response.data.status === "SUBMITTED" || response.data.status === "AUTO_SUBMITTED") {
          setIsSubmitted(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to initialize exam session.");
      } finally {
        setLoading(false);
      }
    };
    startAttempt();
  }, [examId]);

  useEffect(() => {
    if (!attempt || !stompClient) return;

    const subscription = stompClient.subscribe(`/topic/attempt/${attempt.id}/status`, (message: any) => {
      const payload = JSON.parse(message.body);
      if (payload.status === "SUSPENDED") {
        setIsSuspended(true);
      } else if (payload.status === "SUBMITTED" || payload.status === "AUTO_SUBMITTED") {
        setIsSubmitted(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [attempt, stompClient]);

  useSecurityTracker(attempt?.id || 0, () => {
    setIsSuspended(true);
  });

  const { saveAnswer } = useAutosave(attempt?.id || 0);

  const remainingSeconds = useTimer(attempt?.id || 0, () => {
    handleFinalSubmit(true);
  });

  const handleAnswerSelect = (id: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [id]: answer }));
    saveAnswer(id, answer);
  };

  const handleFinalSubmit = async (isAuto = false) => {
    if (!attempt) return;
    setLoading(true);
    console.log("Finalizing submission. Auto:", isAuto);
    try {
      await apiClient.post(`/student/attempts/${attempt.id}/submit`);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setLoading(false);
    }
  };

  const requestFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  if (loading) {
    return <div className="layout-container"><p>Initializing secure examination window...</p></div>;
  }

  if (error) {
    return (
      <div className="layout-container" style={{ textAlign: "center", marginTop: "4rem" }}>
        <p style={{ color: "var(--state-danger)", marginBottom: "1.5rem" }}>{error}</p>
        <button onClick={onFinished} className="btn btn-secondary">Return to Dashboard</button>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="layout-container" style={{ textAlign: "center", marginTop: "8rem", padding: "3rem", border: "1px solid var(--border-subtle)", borderRadius: "4px" }}>
        <h1 className="flat-title" style={{ color: "var(--state-danger)", marginBottom: "1rem" }}>Session Suspended</h1>
        <p style={{ color: "var(--fg-secondary)", marginBottom: "2rem" }}>
          This attempt has been locked due to exceeding the maximum permitted security violations. Please contact the proctor or administrator.
        </p>
        <button onClick={onFinished} className="btn btn-secondary">Back to Available List</button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="layout-container" style={{ textAlign: "center", marginTop: "8rem", padding: "3rem", border: "1px solid var(--border-subtle)", borderRadius: "4px" }}>
        <h1 className="flat-title" style={{ color: "var(--accent-primary)", marginBottom: "1rem" }}>Exam Finalized</h1>
        <p style={{ color: "var(--fg-secondary)", marginBottom: "2rem" }}>
          Your attempt has been submitted successfully. Grading is currently being finalized.
        </p>
        <button onClick={onFinished} className="btn btn-secondary">Return to Available List</button>
      </div>
    );
  }

  if (!attempt || attempt.questions.length === 0) return null;

  const activeQuestion = attempt.questions[activeQuestionIndex];
  const formattedTime = remainingSeconds !== null
    ? `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`
    : "--";

  return (
    <div className="layout-container" style={{ display: "flex", gap: "2rem", height: "calc(100vh - 120px)", alignItems: "stretch" }}>
      
      <aside style={{ width: "260px", borderRight: "1px solid var(--border-subtle)", paddingRight: "1.5rem", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--fg-secondary)", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Time Remaining</h3>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: (remainingSeconds && remainingSeconds < 300) ? "var(--state-danger)" : "var(--accent-primary)" }}>
            {formattedTime}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--fg-secondary)", letterSpacing: "0.05em", marginBottom: "1rem" }}>Questions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
            {attempt.questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isActive = idx === activeQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  style={{
                    padding: "0.5rem 0",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    borderRadius: "4px",
                    border: isActive ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                    backgroundColor: isActive 
                      ? "var(--accent-light)" 
                      : isAnswered ? "var(--bg-secondary)" : "transparent",
                    color: isActive ? "var(--accent-primary)" : "var(--fg-primary)",
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <button 
            onClick={() => handleFinalSubmit(false)} 
            className="btn btn-primary" 
            style={{ width: "100%", backgroundColor: "var(--state-warning)", color: "#fff" }}
          >
            Submit Attempt
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, paddingLeft: "1rem", display: "flex", flexDirection: "column" }}>
        {!document.fullscreenElement && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309", padding: "1rem", borderRadius: "4px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            <span>Security warning: Examination must be run in Fullscreen mode.</span>
            <button onClick={requestFullscreen} className="btn btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "#b45309" }}>
              Enable Fullscreen
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--fg-secondary)", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Question {activeQuestionIndex + 1} of {attempt.questions.length}
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "2rem" }}>
            {activeQuestion.questionText}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {activeQuestion.type === "MCQ" && (
              <>
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const optionText = 
                    opt === "A" ? activeQuestion.optionA :
                    opt === "B" ? activeQuestion.optionB :
                    opt === "C" ? activeQuestion.optionC :
                    activeQuestion.optionD;
                  return (
                    <label 
                      key={opt} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "1rem", 
                        padding: "1rem", 
                        border: "1px solid var(--border-subtle)", 
                        borderRadius: "4px", 
                        cursor: "pointer",
                        backgroundColor: answers[activeQuestion.id] === opt ? "var(--accent-light)" : "transparent",
                        transition: "var(--transition-smooth)"
                      }}
                    >
                      <input
                        type="radio"
                        name={`question_${activeQuestion.id}`}
                        checked={answers[activeQuestion.id] === opt}
                        onChange={() => handleAnswerSelect(activeQuestion.id, opt)}
                        style={{ accentColor: "var(--accent-primary)" }}
                      />
                      <span>{opt}. {optionText}</span>
                    </label>
                  );
                })}
              </>
            )}

            {activeQuestion.type === "TRUE_FALSE" && (
              <>
                {(["A", "B"] as const).map((opt) => (
                  <label 
                    key={opt} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "1rem", 
                      padding: "1rem", 
                      border: "1px solid var(--border-subtle)", 
                      borderRadius: "4px", 
                      cursor: "pointer",
                      backgroundColor: answers[activeQuestion.id] === opt ? "var(--accent-light)" : "transparent",
                      transition: "var(--transition-smooth)"
                    }}
                  >
                    <input
                      type="radio"
                      name={`question_${activeQuestion.id}`}
                      checked={answers[activeQuestion.id] === opt}
                      onChange={() => handleAnswerSelect(activeQuestion.id, opt)}
                      style={{ accentColor: "var(--accent-primary)" }}
                    />
                    <span>{opt === "A" ? "True" : "False"}</span>
                  </label>
                ))}
              </>
            )}

            {activeQuestion.type === "SUBJECTIVE" && (
              <textarea
                className="form-input"
                rows={8}
                placeholder="Type your comprehensive response here..."
                value={answers[activeQuestion.id] || ""}
                onChange={(e) => handleAnswerSelect(activeQuestion.id, e.target.value)}
                style={{ width: "100%", resize: "vertical", fontFamily: "var(--font-family)" }}
              />
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1.5rem", marginTop: "2rem", display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeQuestionIndex === 0}
            className="btn btn-secondary"
          >
            Previous
          </button>
          
          <button
            onClick={() => setActiveQuestionIndex((prev) => Math.min(attempt.questions.length - 1, prev + 1))}
            disabled={activeQuestionIndex === attempt.questions.length - 1}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
