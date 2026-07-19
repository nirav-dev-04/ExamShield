import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminSidebar } from "./components/AdminSidebar";
import { ProctorSidebar } from "./components/ProctorSidebar";
import { StudentSidebar } from "./components/StudentSidebar";
import { apiClient } from "./config/axios";
import type { Exam } from "./types/exam";

// Lazy-load routes/pages to improve performance & bundle splitting (Rule 1)
const Login = lazy(() => import("./pages/auth/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("./pages/auth/Register").then(m => ({ default: m.Register })));
const ExamList = lazy(() => import("./pages/student/ExamList").then(m => ({ default: m.ExamList })));
const ExamConsole = lazy(() => import("./pages/student/ExamConsole").then(m => ({ default: m.ExamConsole })));
const ExamResults = lazy(() => import("./pages/student/ExamResults").then(m => ({ default: m.ExamResults })));
const LiveDashboard = lazy(() => import("./pages/proctor/LiveDashboard").then(m => ({ default: m.LiveDashboard })));
const SubjectiveGrading = lazy(() => import("./pages/proctor/SubjectiveGrading").then(m => ({ default: m.SubjectiveGrading })));
const SessionDetail = lazy(() => import("./pages/proctor/SessionDetail").then(m => ({ default: m.SessionDetail })));
const DashboardOverview = lazy(() => import("./pages/admin/DashboardOverview").then(m => ({ default: m.DashboardOverview })));
const ExamManager = lazy(() => import("./pages/admin/ExamManager").then(m => ({ default: m.ExamManager })));
const QuestionCreator = lazy(() => import("./pages/admin/QuestionCreator").then(m => ({ default: m.QuestionCreator })));
const PerformanceAnalytics = lazy(() => import("./pages/admin/PerformanceAnalytics").then(m => ({ default: m.PerformanceAnalytics })));
const UserManagement = lazy(() => import("./pages/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const QuestionBank = lazy(() => import("./pages/admin/QuestionBank").then(m => ({ default: m.QuestionBank })));
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));

// Skeleton page loader for Suspense (Rule 6)
function PageLoader() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "3rem", height: "100vh", width: "100%", backgroundColor: "var(--bg-primary)" }}>
      <div style={{ height: "2.5rem", width: "40%", backgroundColor: "var(--border-subtle)", borderRadius: "8px", animation: "pulse 1.5s infinite ease-in-out" }} />
      <div style={{ height: "1.25rem", width: "60%", backgroundColor: "var(--border-subtle)", borderRadius: "6px", animation: "pulse 1.5s infinite ease-in-out" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
        <div style={{ height: "200px", backgroundColor: "var(--border-subtle)", borderRadius: "16px", animation: "pulse 1.5s infinite ease-in-out" }} />
        <div style={{ height: "200px", backgroundColor: "var(--border-subtle)", borderRadius: "16px", animation: "pulse 1.5s infinite ease-in-out" }} />
        <div style={{ height: "200px", backgroundColor: "var(--border-subtle)", borderRadius: "16px", animation: "pulse 1.5s infinite ease-in-out" }} />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function ExamConsoleWrapper() {
  const { examId } = useParams();
  const navigate = useNavigate();
  return (
    <ExamConsole 
      examId={parseInt(examId || "0")} 
      onFinished={() => navigate("/student/dashboard")} 
    />
  );
}

function ProctorDashboardWrapper() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proctorExamIdInput, setProctorExamIdInput] = useState("");
  const [assignedExams, setAssignedExams] = useState<Exam[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  useEffect(() => {
    if (user && user.role === "PROCTOR") {
      const fetchAssigned = async () => {
        setLoadingAssigned(true);
        try {
          const response = await apiClient.get<Exam[]>("/proctor/exams");
          setAssignedExams(response.data);
        } catch (e) {
          console.error("Failed to load assigned exams for proctor", e);
        } finally {
          setLoadingAssigned(false);
        }
      };
      fetchAssigned();
    }
  }, [user]);

  return (
    <ProctorSidebar>
      <div className="layout-container" style={{ maxWidth: "500px", margin: "4rem auto 0 auto", textAlign: "center" }}>
        <h1 className="flat-title" style={{ marginBottom: "1rem" }}>Proctor Monitoring Portal</h1>
        <p className="flat-subtitle" style={{ marginBottom: "2rem" }}>Select an assigned examination or input an ID manually to start monitoring</p>
        
        {loadingAssigned ? (
          <p style={{ color: "var(--fg-secondary)", marginBottom: "1.5rem" }}>Loading assigned exams...</p>
        ) : assignedExams.length > 0 ? (
          <div className="form-group" style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            <label className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Select Assigned Exam</label>
            <select 
              className="form-input" 
              onChange={(e) => {
                if (e.target.value) {
                  navigate(`/proctor/exam/${e.target.value}`);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>-- Choose Exam --</option>
              {assignedExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} (ID: {ex.id})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p style={{ color: "var(--state-warning)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            No exams are currently assigned to your account.
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", color: "var(--fg-secondary)" }}>
          <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--border-subtle)" }} />
          <span style={{ padding: "0 0.75rem", fontSize: "0.8rem", fontWeight: 600 }}>OR MANUAL ID</span>
          <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--border-subtle)" }} />
        </div>

        <div className="form-group">
          <input
            type="number"
            className="form-input"
            placeholder="Enter Exam Session ID"
            value={proctorExamIdInput}
            onChange={(e) => setProctorExamIdInput(e.target.value)}
          />
        </div>
        <button
          onClick={() => proctorExamIdInput && navigate(`/proctor/exam/${proctorExamIdInput}`)}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          Start Monitoring
        </button>
      </div>
    </ProctorSidebar>
  );
}

function LiveDashboardWrapper() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const parsedExamId = parseInt(examId || "0");
  return (
    <ProctorSidebar examId={parsedExamId}>
      <LiveDashboard 
        examId={parsedExamId} 
        onViewGrading={() => navigate(`/proctor/exam/${examId}/grading`)}
        onBack={() => navigate("/proctor/dashboard")}
      />
    </ProctorSidebar>
  );
}

function SubjectiveGradingWrapper() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const parsedExamId = parseInt(examId || "0");
  return (
    <ProctorSidebar examId={parsedExamId}>
      <SubjectiveGrading 
        examId={parsedExamId} 
        onBack={() => navigate(`/proctor/exam/${examId}`)}
      />
    </ProctorSidebar>
  );
}


function AdminExamsWrapper() {
  const navigate = useNavigate();
  return (
    <ExamManager
      onViewAnalytics={(id) => navigate(`/admin/exams/${id}/analytics`)}
      onViewQuestionPool={(id) => navigate(`/admin/exams/${id}/pool`)}
    />
  );
}

function QuestionCreatorWrapper() {
  const { examId } = useParams();
  const navigate = useNavigate();
  return (
    <QuestionCreator 
      examId={parseInt(examId || "0")} 
      onBack={() => navigate("/admin/exams")} 
    />
  );
}

function PerformanceAnalyticsWrapper() {
  const { examId } = useParams();
  const navigate = useNavigate();
  return (
    <PerformanceAnalytics 
      examId={parseInt(examId || "0")} 
      onBack={() => navigate("/admin/exams")} 
    />
  );
}

function QuestionBankWrapper() {
  const navigate = useNavigate();
  return <QuestionBank onBack={() => navigate("/admin/dashboard")} />;
}

function ExamListWrapper() {
  const navigate = useNavigate();
  return (
    <StudentSidebar>
      <ExamList onStartExam={(id) => navigate(`/student/exam/${id}`)} />
    </StudentSidebar>
  );
}

function SessionDetailWrapper() {
  const { examId } = useParams();
  const parsedExamId = parseInt(examId || "0");
  return (
    <ProctorSidebar examId={parsedExamId}>
      <SessionDetail />
    </ProctorSidebar>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading application state...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      {/* Public / Redirect */}
      <Route path="/" element={<Home />} />
      
      {/* Auth Portals */}
      <Route path="/student/login" element={
        <div className="panel-student" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
          <Login />
        </div>
      } />
      <Route path="/student/register" element={
        <div className="panel-student" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
          <Register />
        </div>
      } />
      <Route path="/proctor/login" element={
        <div className="panel-proctor" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
          <Login />
        </div>
      } />
      <Route path="/admin/login" element={
        <div className="panel-admin" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
          <Login />
        </div>
      } />

      {/* Student Panel */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <ExamListWrapper />
        </ProtectedRoute>
      } />
      <Route path="/student/exam/:examId" element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <div className="panel-student" style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
            <ExamConsoleWrapper />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/student/results" element={
        <ProtectedRoute allowedRoles={["STUDENT"]}>
          <StudentSidebar>
            <ExamResults />
          </StudentSidebar>
        </ProtectedRoute>
      } />

      {/* Proctor Panel */}
      <Route path="/proctor/dashboard" element={
        <ProtectedRoute allowedRoles={["PROCTOR"]}>
          <ProctorDashboardWrapper />
        </ProtectedRoute>
      } />
      <Route path="/proctor/exam/:examId" element={
        <ProtectedRoute allowedRoles={["PROCTOR"]}>
          <LiveDashboardWrapper />
        </ProtectedRoute>
      } />
      <Route path="/proctor/exam/:examId/grading" element={
        <ProtectedRoute allowedRoles={["PROCTOR"]}>
          <SubjectiveGradingWrapper />
        </ProtectedRoute>
      } />
      <Route path="/proctor/exam/:examId/attempt/:attemptId" element={
        <ProtectedRoute allowedRoles={["PROCTOR"]}>
          <SessionDetailWrapper />
        </ProtectedRoute>
      } />

        {/* Admin Panel */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminSidebar>
              <DashboardOverview />
            </AdminSidebar>
          </ProtectedRoute>
        } />
        <Route path="/admin/exams" element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminSidebar>
              <AdminExamsWrapper />
            </AdminSidebar>
          </ProtectedRoute>
        } />
        <Route path="/admin/exams/:examId/pool" element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminSidebar>
              <QuestionCreatorWrapper />
            </AdminSidebar>
          </ProtectedRoute>
        } />
        <Route path="/admin/exams/:examId/analytics" element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminSidebar>
              <PerformanceAnalyticsWrapper />
            </AdminSidebar>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminSidebar>
              <UserManagement />
            </AdminSidebar>
          </ProtectedRoute>
        } />
        <Route path="/admin/questions" element={
          <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminSidebar>
              <QuestionBankWrapper />
            </AdminSidebar>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Disabled restriction for split screen testing
      setIsMobile(false);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        padding: "2rem",
        backgroundColor: "#0d0f14",
        color: "#fff",
        textAlign: "center",
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          padding: "2.5rem",
          borderRadius: "16px",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          maxWidth: "450px",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "#ef4444" }}>
            Mobile Device Restricted
          </h2>
          <p style={{ color: "#a0aec0", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "1.5rem" }}>
            ExamShield is only accessible via desktop browsers. Please switch to a laptop or desktop computer to access your examination portal.
          </p>
          <div style={{ fontSize: "0.75rem", color: "#718096" }}>
            Screen resolution and mobile environment restrictions are enforced.
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
}
