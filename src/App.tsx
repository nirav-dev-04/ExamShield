import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { Navigation } from "./components/Navigation";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ExamList } from "./pages/student/ExamList";
import { ExamConsole } from "./pages/student/ExamConsole";
import { LiveDashboard } from "./pages/proctor/LiveDashboard";
import { SubjectiveGrading } from "./pages/proctor/SubjectiveGrading";
import { ExamManager } from "./pages/admin/ExamManager";
import { QuestionCreator } from "./pages/admin/QuestionCreator";
import { PerformanceAnalytics } from "./pages/admin/PerformanceAnalytics";

function MainAppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  
  const [activeExamId, setActiveExamId] = useState<number | null>(null);

  const [proctorExamIdInput, setProctorExamIdInput] = useState("");
  const [activeProctorExamId, setActiveProctorExamId] = useState<number | null>(null);
  const [showGradingQueue, setShowGradingQueue] = useState(false);

  const [activeAdminExamId, setActiveAdminExamId] = useState<number | null>(null);
  const [adminView, setAdminView] = useState<"manager" | "creator" | "analytics">("manager");

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading application state...</p>
      </div>
    );
  }

  if (!user) {
    return showRegister ? (
      <Register onToggleAuth={() => setShowRegister(false)} />
    ) : (
      <Login onToggleAuth={() => setShowRegister(true)} />
    );
  }

  if (user.role === "STUDENT") {
    return (
      <>
        <Navigation />
        {activeExamId ? (
          <ExamConsole examId={activeExamId} onFinished={() => setActiveExamId(null)} />
        ) : (
          <ExamList onStartExam={(id) => setActiveExamId(id)} />
        )}
      </>
    );
  }

  if (user.role === "PROCTOR") {
    return (
      <>
        <Navigation />
        {activeProctorExamId ? (
          showGradingQueue ? (
            <SubjectiveGrading examId={activeProctorExamId} onBack={() => setShowGradingQueue(false)} />
          ) : (
            <LiveDashboard
              examId={activeProctorExamId}
              onViewGrading={() => setShowGradingQueue(true)}
              onBack={() => setActiveProctorExamId(null)}
            />
          )
        ) : (
          <div className="layout-container" style={{ maxWidth: "500px", marginTop: "6rem", textAlign: "center" }}>
            <h1 className="flat-title" style={{ marginBottom: "1rem" }}>Proctor Monitoring portal</h1>
            <p className="flat-subtitle" style={{ marginBottom: "2rem" }}>Enter a published examination ID to start live supervision</p>
            <div className="form-group">
              <input
                type="number"
                className="form-input"
                placeholder="Exam Session ID"
                value={proctorExamIdInput}
                onChange={(e) => setProctorExamIdInput(e.target.value)}
              />
            </div>
            <button
              onClick={() => proctorExamIdInput && setActiveProctorExamId(parseInt(proctorExamIdInput))}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Start Monitoring
            </button>
          </div>
        )}
      </>
    );
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return (
      <>
        <Navigation />
        {adminView === "manager" && (
          <ExamManager
            onViewAnalytics={(id) => {
              setActiveAdminExamId(id);
              setAdminView("analytics");
            }}
            onViewQuestionPool={(id) => {
              setActiveAdminExamId(id);
              setAdminView("creator");
            }}
          />
        )}
        {adminView === "creator" && activeAdminExamId && (
          <QuestionCreator examId={activeAdminExamId} onBack={() => setAdminView("manager")} />
        )}
        {adminView === "analytics" && activeAdminExamId && (
          <PerformanceAnalytics examId={activeAdminExamId} onBack={() => setAdminView("manager")} />
        )}
      </>
    );
  }

  return (
    <div className="layout-container">
      <p>System error: Unauthorized security role.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainAppContent />
      </WebSocketProvider>
    </AuthProvider>
  );
}
