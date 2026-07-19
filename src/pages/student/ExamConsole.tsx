import { useEffect, useState, useRef } from "react";
import { apiClient } from "../../config/axios";
import type { ExamAttemptResponseDTO, QuestionResponseDTO } from "../../types/attempt";
import { useSecurityTracker } from "../../hooks/useSecurityTracker";
import { useAutosave } from "../../hooks/useAutosave";
import { useTimer } from "../../hooks/useTimer";
import { useWebSocket } from "../../context/WebSocketContext";

// Floating Webcam Monitoring Component
function WebcamWidget({ stream }: { stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      width: "180px",
      height: "135px",
      borderRadius: "12px",
      overflow: "hidden",
      border: "2px solid var(--accent-primary)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      backgroundColor: "#000",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column"
    }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
      />
      <div style={{
        position: "absolute",
        top: "8px",
        left: "8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: "2px 6px",
        borderRadius: "4px",
        fontSize: "0.65rem",
        color: "#fff",
        fontWeight: 600,
        fontFamily: "var(--font-family)"
      }}>
        <span style={{
          width: "6px",
          height: "6px",
          backgroundColor: "#22c55e",
          borderRadius: "50%",
          display: "inline-block",
          animation: "pulse 1.5s infinite"
        }} />
        PROCTOR ACTIVE
      </div>
    </div>
  );
}

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
      if (payload.type === "WARNING") {
        alert("⚠️ PROCTOR WARNING:\n\n" + payload.message);
      } else if (payload.status === "SUSPENDED") {
        setIsSuspended(true);
      } else if (payload.status === "IN_PROGRESS") {
        setIsSuspended(false);
        window.location.reload();
      } else if (payload.status === "SUBMITTED" || payload.status === "AUTO_SUBMITTED") {
        setIsSubmitted(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [attempt, stompClient]);

  // Send live student track updates to proctor
  useEffect(() => {
    if (!attempt) return;

    const sendTrackUpdate = async () => {
      try {
        const currentQuestion = attempt.questions[activeQuestionIndex];
        const currentQuestionText = currentQuestion ? currentQuestion.questionText : "";
        const answeredCount = Object.keys(answers).length;
        const totalQuestions = attempt.questions.length;

        // Build question status map
        const questionStatusMap: { [key: number]: string } = {};
        attempt.questions.forEach((q, idx) => {
          if (idx === activeQuestionIndex) {
            questionStatusMap[idx] = "CURRENT";
          } else if (answers[q.id]) {
            questionStatusMap[idx] = "ANSWERED";
          } else {
            questionStatusMap[idx] = "UNANSWERED";
          }
        });

        // Determine last action text
        let lastAction = `Viewing Question ${activeQuestionIndex + 1}`;
        const currentAnswer = answers[currentQuestion?.id];
        if (currentAnswer) {
          lastAction = `Answered Question ${activeQuestionIndex + 1} (${currentAnswer.length > 20 ? currentAnswer.substring(0, 17) + "..." : currentAnswer})`;
        }

        await apiClient.post(`/student/attempts/${attempt.id}/track`, {
          currentQuestionIndex: activeQuestionIndex,
          currentQuestionText,
          answeredCount,
          totalQuestions,
          lastAction,
          questionStatusMap
        });
      } catch (err) {
        console.error("Failed to send track update", err);
      }
    };

    const delayDebounce = setTimeout(() => {
      sendTrackUpdate();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [activeQuestionIndex, answers, attempt]);

  const { cameraStream, permissionsGranted, requestPermissions, reportViolation } = useSecurityTracker(attempt?.id || 0, () => {
    setIsSuspended(true);
  });

  const { saveAnswer, saveStatus } = useAutosave(attempt?.id || 0);

  const remainingSeconds = useTimer(attempt?.id || 0, () => {
    handleFinalSubmit(true);
  });

  const handleAnswerSelect = (id: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [id]: answer }));
    saveAnswer(id, answer);
  };

  const handleFinalSubmit = async (isAuto = false) => {
    if (!attempt) return;
    if (!isAuto) {
      const confirmed = window.confirm("Are you sure you want to submit your exam attempt? Once submitted, you cannot change your answers.");
      if (!confirmed) return;
    }
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

  // Premium state page renderer
  const renderStatePage = (
    title: string,
    description: string,
    icon: React.ReactNode,
    buttonText: string,
    buttonAction: () => void,
    accentColor: string
  ) => {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        padding: "2rem",
        backgroundColor: "var(--bg-primary)"
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .glass-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 48px rgba(0,0,0,0.06) !important;
          }
        `}</style>
        <div style={{
          width: "100%",
          maxWidth: "480px",
          padding: "3.5rem 2.5rem",
          borderRadius: "24px",
          border: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-secondary)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.02)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease"
        }}
        className="glass-card"
        >
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: `${accentColor}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "2rem",
            color: accentColor
          }}>
            {icon}
          </div>
          
          <h1 style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--fg-primary)",
            marginBottom: "1rem",
            letterSpacing: "-0.02em",
            lineHeight: "1.3"
          }}>
            {title}
          </h1>
          
          <p style={{
            fontSize: "0.95rem",
            color: "var(--fg-secondary)",
            lineHeight: "1.6",
            marginBottom: "2.5rem",
            fontFamily: "var(--font-family)"
          }}>
            {description}
          </p>
          
          <button
            onClick={buttonAction}
            style={{
              padding: "0.8rem 2.5rem",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            className="btn btn-secondary"
          >
            {buttonText}
          </button>
        </div>
      </div>
    );
  };

  const ClockIcon = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const SuspendedIcon = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  );

  const SuccessBadgeIcon = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );

  const ErrorIcon = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        backgroundColor: "var(--bg-primary)"
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3.5px solid var(--border-subtle)",
            borderTopColor: "var(--accent-primary)",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{
            color: "var(--fg-secondary)",
            fontSize: "0.95rem",
            fontWeight: 500,
            fontFamily: "var(--font-family)"
          }}>
            Setting up secure session environment...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const lowerError = error.toLowerCase();
    const isNotStarted = lowerError.includes("not started");
    const isSuspendedError = lowerError.includes("suspended");
    const isSubmittedError = lowerError.includes("submitted") || lowerError.includes("completed") || lowerError.includes("already");

    if (isNotStarted) {
      return renderStatePage(
        "Exam Has Not Started Yet",
        "This examination session is not active yet. Please return when the scheduled start time is reached.",
        ClockIcon,
        "Return to Dashboard",
        onFinished,
        "#4a5ff7"
      );
    }
    
    if (isSuspendedError) {
      return renderStatePage(
        "Session Suspended",
        "Your exam session has been suspended by the proctor due to violation of exam policies.",
        SuspendedIcon,
        "Return to Dashboard",
        onFinished,
        "#ef4444"
      );
    }

    if (isSubmittedError) {
      return renderStatePage(
        "Exam Already Completed",
        "You have already completed and submitted your attempt for this exam.",
        SuccessBadgeIcon,
        "Return to Dashboard",
        onFinished,
        "#10b981"
      );
    }

    return renderStatePage(
      "Secure Session Error",
      error.replace("DataIntegrityViolationException: could not execute statement", "Session initialization failed")
           .replace("[ERROR: duplicate key value violates unique constraint \"exam_attempts_exam_id_student_id_key\" Detail: Key (exam_id, student_id)=(10, 4) already exists.]", "An active session already exists for this exam."),
      ErrorIcon,
      "Return to Dashboard",
      onFinished,
      "#ef4444"
    );
  }

  if (isSuspended) {
    return renderStatePage(
      "Session Suspended",
      "This attempt has been locked due to exceeding the maximum permitted security violations. Please contact the proctor or administrator.",
      SuspendedIcon,
      "Return to Dashboard",
      onFinished,
      "#ef4444"
    );
  }

  if (isSubmitted) {
    return renderStatePage(
      "Exam Finalized",
      "Your attempt has been submitted successfully. Grading is currently being finalized.",
      SuccessBadgeIcon,
      "Return to Dashboard",
      onFinished,
      "#10b981"
    );
  }

  if (attempt && !permissionsGranted) {
    return (
      <div className="layout-container" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "6rem",
        padding: "3rem",
        border: "1px solid var(--border-subtle)",
        borderRadius: "16px",
        backgroundColor: "var(--bg-secondary)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.03)",
        textAlign: "center",
        maxWidth: "600px",
        marginLeft: "auto",
        marginRight: "auto"
      }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem", color: "var(--fg-primary)", fontFamily: "var(--font-family)" }}>
          🔒 Secure Proctoring Environment Required
        </h1>
        <p style={{ color: "var(--fg-secondary)", marginBottom: "2rem", lineHeight: "1.6", fontFamily: "var(--font-family)" }}>
          To start the examination, you must configure the integrity shield. This requires sharing your active monitor screen and enabling your camera stream.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", backgroundColor: "rgba(74, 95, 247, 0.05)", border: "1px solid rgba(74, 95, 247, 0.1)", borderRadius: "8px", textAlign: "left" }}>
            <span style={{ fontSize: "1.5rem" }}>📷</span>
            <div>
              <h4 style={{ fontWeight: 600, color: "var(--fg-primary)", margin: 0, fontSize: "0.95rem" }}>Webcam Feed</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", margin: "4px 0 0 0" }}>Verifies candidate identity and checks for mobile devices.</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", backgroundColor: "rgba(74, 95, 247, 0.05)", border: "1px solid rgba(74, 95, 247, 0.1)", borderRadius: "8px", textAlign: "left" }}>
            <span style={{ fontSize: "1.5rem" }}>🖥️</span>
            <div>
              <h4 style={{ fontWeight: 600, color: "var(--fg-primary)", margin: 0, fontSize: "0.95rem" }}>Monitor Screen Share</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", margin: "4px 0 0 0" }}>Ensures candidate remains within the authorized browser tab.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            requestPermissions().then(() => {
              requestFullscreen();
            }).catch(() => {});
          }} 
          className="btn btn-primary"
          style={{ width: "100%", padding: "1rem", fontWeight: 600, fontSize: "1rem" }}
        >
          Initialize Integrity Shield & Start
        </button>
      </div>
    );
  }

  if (!attempt || attempt.questions.length === 0) return null;

  const activeQuestion = attempt.questions[activeQuestionIndex];
  const formattedTime = remainingSeconds !== null
    ? `${Math.floor(remainingSeconds / 60)}m ${remainingSeconds % 60}s`
    : "--";

  return (
    <>
      <WebcamWidget stream={cameraStream} />
      <div className="layout-container" style={{ 
        display: "flex", 
        gap: "2.5rem", 
        height: "calc(100vh - 80px)", 
        alignItems: "stretch", 
        marginTop: "2rem",
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "16px",
        border: "1px solid var(--border-subtle)",
        padding: "2.5rem",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)"
      }}>
        
        <aside style={{ width: "260px", borderRight: "1px solid var(--border-subtle)", paddingRight: "2rem", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--fg-secondary)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Time Remaining</h3>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: (remainingSeconds && remainingSeconds < 300) ? "var(--state-danger)" : "var(--accent-primary)", fontFamily: "'Outfit', sans-serif" }}>
              {formattedTime}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--fg-secondary)" }}>Status:</span>
            {saveStatus === "idle" && (
              <span style={{ fontSize: "0.8rem", color: "var(--fg-secondary)" }}>Ready</span>
            )}
            {saveStatus === "saving" && (
              <span style={{ fontSize: "0.8rem", color: "var(--state-warning)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span style={{ fontSize: "0.8rem", color: "var(--state-success)", fontWeight: 500 }}>✓ Autosaved</span>
            )}
            {saveStatus === "error" && (
              <span style={{ fontSize: "0.8rem", color: "var(--state-danger)", fontWeight: 500 }}>⚠ Save Error</span>
            )}
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

          {/* Sandbox Controls for Proctoring Simulation */}
          <div style={{ 
            marginTop: "1.5rem", 
            padding: "1rem", 
            backgroundColor: "rgba(232, 163, 61, 0.05)", 
            border: "1px dashed var(--state-warning)", 
            borderRadius: "8px",
            fontSize: "0.85rem"
          }}>
            <div style={{ fontWeight: 700, color: "var(--state-warning)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              🛠️ Sandbox Simulation
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--fg-secondary)", margin: "0 0 0.75rem 0", lineHeight: "1.3" }}>
              Simulate candidate behavior flags to test proctor dashboard alerts.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button 
                onClick={() => {
                  reportViolation("MOBILE_PHONE_DETECTED");
                  alert("📱 Sandbox: Simulated mobile phone detection.");
                }}
                className="btn btn-secondary"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                📱 Mobile Detected
              </button>
              <button 
                onClick={() => {
                  reportViolation("SCREENSHOT_ATTEMPT");
                  alert("📸 Sandbox: Simulated screenshot attempt.");
                }}
                className="btn btn-secondary"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                📸 Screenshot
              </button>
              <button 
                onClick={() => {
                  reportViolation("SCREEN_RECORDING_ATTEMPT");
                  alert("🎥 Sandbox: Simulated screen recording.");
                }}
                className="btn btn-secondary"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                🎥 Screen Recording
              </button>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
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
                          border: answers[activeQuestion.id] === opt ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-subtle)", 
                          borderRadius: "8px", 
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
                        <span style={{ fontWeight: answers[activeQuestion.id] === opt ? 600 : 500 }}>{opt}. {optionText}</span>
                      </label>
                    );
                  })}
                </>
              )}

              {activeQuestion.type === "TRUE_FALSE" && (
                <>
                  {(["TRUE", "FALSE"] as const).map((opt) => (
                    <label 
                      key={opt} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "1rem", 
                        padding: "1rem", 
                        border: answers[activeQuestion.id] === opt ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-subtle)", 
                        borderRadius: "8px", 
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
                      <span style={{ fontWeight: answers[activeQuestion.id] === opt ? 600 : 500 }}>{opt === "TRUE" ? "True" : "False"}</span>
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
            
            {activeQuestionIndex === attempt.questions.length - 1 ? (
              <button
                onClick={() => handleFinalSubmit(false)}
                className="btn btn-primary"
                style={{ backgroundColor: "var(--state-warning)", color: "#fff", border: "none" }}
              >
                Submit Exam
              </button>
            ) : (
              <button
                onClick={() => setActiveQuestionIndex((prev) => Math.min(attempt.questions.length - 1, prev + 1))}
                className="btn btn-secondary"
              >
                Next
              </button>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
