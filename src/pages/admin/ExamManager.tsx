import { useState, useEffect } from "react";
import { apiClient } from "../../config/axios";
import type { Exam } from "../../types/exam";
import { 
  Calendar, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Lock, 
  Users, 
  CheckCircle,
  PlusCircle,
  Activity,
  Award,
  ChevronRight
} from "lucide-react";

interface ExamManagerProps {
  onViewAnalytics: (examId: number) => void;
  onViewQuestionPool: (examId: number) => void;
}

export function ExamManager({ onViewAnalytics, onViewQuestionPool }: ExamManagerProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allProctors, setAllProctors] = useState<{ id: number; fullName: string; email: string }[]>([]);
  const [selectedProctors, setSelectedProctors] = useState<{ [examId: number]: string }>({});

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [easyCount, setEasyCount] = useState(4);
  const [mediumCount, setMediumCount] = useState(4);
  const [hardCount, setHardCount] = useState(2);
  const [passingMarks, setPassingMarks] = useState(40);
  const [lateEntryMinutes, setLateEntryMinutes] = useState(10);
  const [maxViolations, setMaxViolations] = useState(3);
  const [isSectioned] = useState(false);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);

  // Student Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignExamId, setAssignExamId] = useState<number | null>(null);
  const [isAssignReadOnly, setIsAssignReadOnly] = useState(false);
  const [allStudents, setAllStudents] = useState<{ id: number; fullName: string; email: string }[]>([]);
  const [assignedStudentIds, setAssignedStudentIds] = useState<number[]>([]);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");

  const fetchExams = async () => {
    try {
      const response = await apiClient.get<Exam[]>("/admin/exams");
      setExams(response.data);
    } catch (err) {
      setError("Failed to fetch exams.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProctors = async () => {
    try {
      const response = await apiClient.get<any[]>("/admin/proctors");
      setAllProctors(response.data);
    } catch (err) {
      console.error("Failed to fetch proctors", err);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchProctors();
  }, []);

  const handleAssignProctor = async (examId: number) => {
    const proctorIdStr = selectedProctors[examId];
    if (!proctorIdStr) {
      alert("Please select a proctor first.");
      return;
    }
    try {
      await apiClient.post(`/admin/exams/${examId}/proctors`, null, {
        params: { proctorId: parseInt(proctorIdStr) }
      });
      alert("Proctor successfully assigned!");
      fetchExams();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to assign proctor.");
    }
  };

  const handleEditClick = (exam: Exam) => {
    setEditingExamId(exam.id);
    setTitle(exam.title);
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);
    const toLocalISO = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    setStartTime(toLocalISO(start));
    setEndTime(toLocalISO(end));
    setDurationMinutes(exam.durationMinutes);
    setTotalQuestions(exam.totalQuestions);
    setEasyCount(exam.easyCount || 0);
    setMediumCount(exam.mediumCount || 0);
    setHardCount(exam.hardCount || 0);
    setPassingMarks(exam.passingMarks);
    setLateEntryMinutes(exam.lateEntryMinutes || 10);
    setMaxViolations(exam.maxViolations || 3);
  };

  const handleCancelEdit = () => {
    setEditingExamId(null);
    setTitle("");
    setStartTime("");
    setEndTime("");
    setDurationMinutes(60);
    setTotalQuestions(10);
    setEasyCount(4);
    setMediumCount(4);
    setHardCount(2);
    setPassingMarks(40);
    setLateEntryMinutes(10);
    setMaxViolations(3);
  };

  const handleDeleteExam = async (examId: number) => {
    if (!window.confirm("Are you sure you want to delete this exam? All associated logs and attempts will be deleted permanently.")) {
      return;
    }
    try {
      await apiClient.delete(`/admin/exams/${examId}`);
      alert("Exam deleted successfully!");
      fetchExams();
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete exam.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        startTime,
        endTime,
        durationMinutes,
        totalQuestions,
        easyCount,
        mediumCount,
        hardCount,
        passingMarks,
        lateEntryMinutes,
        maxViolations,
        isSectioned,
      };
      if (editingExamId) {
        await apiClient.put(`/admin/exams/${editingExamId}`, payload);
        alert("Exam updated successfully!");
        setEditingExamId(null);
      } else {
        await apiClient.post("/admin/exams", payload);
        alert("Exam draft created successfully!");
      }
      setTitle("");
      setStartTime("");
      setEndTime("");
      fetchExams();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to save exam. Verify parameters.";
      alert(errMsg);
    }
  };

  const handlePublish = async (examId: number) => {
    try {
      await apiClient.post(`/admin/exams/${examId}/publish`);
      alert("Exam published successfully! Question pool locked.");
      fetchExams();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to publish exam.";
      alert(errMsg);
    }
  };

  const openAssignmentModal = async (examId: number, readOnly: boolean) => {
    setAssignExamId(examId);
    setIsAssignReadOnly(readOnly);
    setLoadingAssign(true);
    setShowAssignModal(true);
    setAssignSearch("");
    try {
      const allRes = await apiClient.get<any>("/admin/users", {
        params: { role: "STUDENT", size: 1000 }
      });
      setAllStudents(allRes.data.content);

      const assignedRes = await apiClient.get<any[]>(`/admin/exams/${examId}/students`);
      setAssignedStudentIds(assignedRes.data.map(s => s.id));
    } catch (err) {
      console.error(err);
      alert("Failed to load student assignment data.");
    } finally {
      setLoadingAssign(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignExamId) return;
    setLoadingAssign(true);
    try {
      await apiClient.post(`/admin/exams/${assignExamId}/students`, assignedStudentIds);
      alert("Student assignments updated successfully!");
      setShowAssignModal(false);
      fetchExams();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save student assignments.");
    } finally {
      setLoadingAssign(false);
    }
  };

  return (
    <div className="layout-container" style={{ padding: "2rem 3rem", height: "100%", overflowY: "auto", scrollBehavior: "smooth" }}>
      <header className="flat-header" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 className="flat-title" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>Exam Management</h1>
        </div>
        <p className="flat-subtitle" style={{ fontSize: "0.9rem", color: "#64748B", marginTop: "0.5rem", margin: 0 }}>
          Create exam schedules, define question structures, assign monitors, and manage student enrollments.
        </p>
      </header>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px", color: "var(--state-danger)", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start" }}>
        
        {/* Left Side: Create / Edit Form Card */}
        <div style={{ 
          flex: "1 1 40%", 
          backgroundColor: "#FFFFFF", 
          border: "1px solid #E2E8F0",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
          position: "sticky",
          top: "2rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.5rem" }}>
            <PlusCircle size={20} className="text-[#6C4FD6]" />
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              {editingExamId ? "Modify Exam Draft" : "Create Exam Configuration"}
            </h2>
          </div>

          <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Exam Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Cybersecurity Midterm Exam"
                required 
                style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.65rem 0.85rem" }}
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Start Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  required 
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.65rem 0.85rem" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>End Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required 
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.65rem 0.85rem" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.85rem" }}>Duration (min)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={durationMinutes} 
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))} 
                  required 
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.65rem 0.85rem" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.85rem" }}>Questions</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={totalQuestions} 
                  onChange={(e) => setTotalQuestions(parseInt(e.target.value))} 
                  required 
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.65rem 0.85rem" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block", fontSize: "0.85rem" }}>Passing Marks</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={passingMarks} 
                  onChange={(e) => setPassingMarks(parseInt(e.target.value))} 
                  required 
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.65rem 0.85rem" }}
                />
              </div>
            </div>

            <div style={{ 
              padding: "1rem", 
              backgroundColor: "#F8FAFC", 
              borderRadius: "12px", 
              border: "1px dashed #E2E8F0" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                <Award size={14} className="text-[#6C4FD6]" />
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Difficulty Distribution</span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: "#64748B", marginBottom: "0.3rem", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>Easy</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={easyCount} 
                    onChange={(e) => setEasyCount(parseInt(e.target.value))} 
                    required 
                    style={{ borderRadius: "6px", border: "1px solid #E2E8F0", padding: "0.45rem 0.65rem", backgroundColor: "#FFFFFF" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: "#64748B", marginBottom: "0.3rem", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>Medium</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={mediumCount} 
                    onChange={(e) => setMediumCount(parseInt(e.target.value))} 
                    required 
                    style={{ borderRadius: "6px", border: "1px solid #E2E8F0", padding: "0.45rem 0.65rem", backgroundColor: "#FFFFFF" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: "#64748B", marginBottom: "0.3rem", display: "block", fontSize: "0.75rem", fontWeight: 600 }}>Hard</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={hardCount} 
                    onChange={(e) => setHardCount(parseInt(e.target.value))} 
                    required 
                    style={{ borderRadius: "6px", border: "1px solid #E2E8F0", padding: "0.45rem 0.65rem", backgroundColor: "#FFFFFF" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Grace Period (min)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={lateEntryMinutes} 
                  onChange={(e) => setLateEntryMinutes(parseInt(e.target.value))} 
                  required 
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.65rem 0.85rem" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Max Violations</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={maxViolations} 
                  onChange={(e) => setMaxViolations(parseInt(e.target.value))} 
                  required 
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.65rem 0.85rem" }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                width: "100%", 
                marginTop: "0.5rem", 
                padding: "0.75rem", 
                fontWeight: 600, 
                backgroundColor: "#6C4FD6", 
                border: "none",
                borderRadius: "8px" 
              }}
            >
              {editingExamId ? "Save Changes" : "Create Exam Draft"}
            </button>
            
            {editingExamId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-secondary"
                style={{ 
                  width: "100%", 
                  padding: "0.75rem", 
                  fontWeight: 600, 
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1"
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Right Side: Active & Draft Exams Cards List */}
        <div style={{ flex: "1 1 60%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Activity size={20} className="text-[#0F172A]" />
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>Active & Draft Exams</h2>
          </div>

          {loading ? (
            <div style={{ color: "#64748B", fontSize: "0.9rem", padding: "2rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={16} className="animate-spin text-[#6C4FD6]" />
              <span>Loading examination directories...</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {exams.length === 0 && (
                <div style={{ padding: "3rem 1.5rem", border: "1px dashed #CBD5E1", borderRadius: "12px", textAlign: "center", color: "#64748B" }}>
                  <Calendar size={32} style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, margin: 0 }}>No exams scheduled yet.</p>
                  <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Configure an exam on the left to begin scheduling.</p>
                </div>
              )}
              
              {exams.map((exam) => {
                const isPublished = exam.isPublished;
                return (
                  <div 
                    key={exam.id} 
                    style={{ 
                      backgroundColor: "#FFFFFF", 
                      border: "1px solid #E2E8F0", 
                      borderRadius: "16px", 
                      padding: "1.5rem",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      position: "relative",
                      borderLeft: isPublished ? "4px solid #6C4FD6" : "4px solid #94A3B8"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>{exam.title}</h3>
                        
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "#64748B" }}>
                            <Calendar size={13} />
                            <span>{new Date(exam.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} - {new Date(exam.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "#64748B" }}>
                            <Clock size={13} />
                            <span>{exam.durationMinutes} minutes</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {isPublished ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: "#F1EDFB",
                            color: "#6C4FD6",
                            border: "1px solid rgba(108, 79, 214, 0.15)"
                          }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#6C4FD6", marginRight: "6px", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                            Active
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: "#F1F5F9",
                            color: "#64748B",
                            border: "1px solid #E2E8F0"
                          }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#64748B", marginRight: "6px", display: "inline-block" }} />
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ 
                      backgroundColor: "#F8FAFC", 
                      borderRadius: "10px", 
                      padding: "0.75rem 1rem", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      border: "1px solid #F1F5F9"
                    }}>
                      <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                        <span style={{ fontWeight: 700, color: "#334155" }}>Monitor: </span>
                        {exam.proctors && exam.proctors.length > 0 ? (
                          <span style={{ color: "#6C4FD6", fontWeight: 600 }}>
                            {exam.proctors.map((p: any) => p.fullName).join(", ")}
                          </span>
                        ) : (
                          <span style={{ color: "#E8A33D", fontWeight: 600 }}>No Proctor Assigned</span>
                        )}
                      </div>

                      {allProctors.length > 0 && (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <select
                            style={{ 
                              padding: "0.35rem 1.75rem 0.35rem 0.65rem", 
                              backgroundColor: "#FFFFFF", 
                              border: "1px solid #CBD5E1", 
                              borderRadius: "6px", 
                              fontSize: "0.75rem", 
                              color: "#334155",
                              outline: "none",
                              width: "160px",
                              minWidth: "160px",
                              cursor: "pointer"
                            }}
                            value={selectedProctors[exam.id] || ""}
                            onChange={(e) => setSelectedProctors((prev) => ({ ...prev, [exam.id]: e.target.value }))}
                          >
                            <option value="">Choose proctor...</option>
                            {allProctors.map((p) => (
                              <option key={p.id} value={p.id.toString()}>
                                {p.fullName}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignProctor(exam.id)}
                            style={{ 
                              padding: "0.35rem 0.75rem", 
                              backgroundColor: "#FFFFFF", 
                              border: "1px solid #CBD5E1", 
                              borderRadius: "6px", 
                              fontSize: "0.75rem", 
                              fontWeight: 600, 
                              color: "#0F172A",
                              cursor: "pointer"
                            }}
                          >
                            Assign
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      flexWrap: "wrap", 
                      gap: "0.75rem", 
                      borderTop: "1px solid #F1F5F9", 
                      paddingTop: "1rem",
                      marginTop: "0.25rem"
                    }}>
                      {/* Setup Actions on the Left */}
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button 
                          onClick={() => openAssignmentModal(exam.id, false)} 
                          className="btn btn-secondary"
                          style={{ 
                            padding: "0.5rem 1rem", 
                            fontSize: "0.75rem", 
                            borderRadius: "8px", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "0.35rem", 
                            border: "1px solid #CBD5E1", 
                            color: "#475569",
                            backgroundColor: "#F8FAFC",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          <Users size={13} />
                          Assign Students
                        </button>
                        
                        {!isPublished && (
                          <button 
                            onClick={() => onViewQuestionPool(exam.id)} 
                            className="btn btn-secondary"
                            style={{ 
                              padding: "0.5rem 1rem", 
                              fontSize: "0.75rem", 
                              borderRadius: "8px", 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.35rem", 
                              border: "1px solid #CBD5E1", 
                              color: "#475569",
                              backgroundColor: "#F8FAFC",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            <HelpCircle size={13} />
                            Pool Settings
                          </button>
                        )}

                        {isPublished && (
                          <button 
                            onClick={() => onViewAnalytics(exam.id)} 
                            className="btn btn-secondary"
                            style={{ 
                              padding: "0.5rem 1rem", 
                              fontSize: "0.75rem", 
                              borderRadius: "8px", 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.35rem", 
                              border: "1px solid #CBD5E1", 
                              color: "#475569",
                              backgroundColor: "#F8FAFC",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            <Activity size={13} />
                            Analytics
                          </button>
                        )}
                      </div>

                      {/* Control Actions on the Right */}
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginLeft: "auto" }}>
                        {!isPublished && (
                          <>
                            <button 
                              onClick={() => handleEditClick(exam)} 
                              className="btn btn-secondary"
                              style={{ 
                                padding: "0.5rem 1rem", 
                                fontSize: "0.75rem", 
                                borderRadius: "8px", 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "0.35rem", 
                                border: "1px solid #CBD5E1", 
                                color: "#475569",
                                backgroundColor: "#FFFFFF",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              <Edit3 size={13} />
                              Edit
                            </button>
                            <button 
                              onClick={() => handlePublish(exam.id)} 
                              className="btn btn-primary"
                              style={{ 
                                padding: "0.5rem 1rem", 
                                fontSize: "0.75rem", 
                                borderRadius: "8px", 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "0.35rem", 
                                backgroundColor: "#6C4FD6", 
                                color: "#FFFFFF", 
                                border: "none",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              <CheckCircle size={13} />
                              Publish
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => handleDeleteExam(exam.id)} 
                          style={{ 
                            padding: "0.5rem 1rem", 
                            fontSize: "0.75rem", 
                            borderRadius: "8px", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "0.35rem", 
                            border: "1px solid #FEE2E2", 
                            color: "#EF4444", 
                            backgroundColor: "#FFF5F5",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Student Assignment Modal */}
      {showAssignModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF", 
            border: "1px solid #E2E8F0",
            borderRadius: "16px", 
            padding: "2rem", 
            width: "480px", 
            maxWidth: "95%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A", marginBottom: "1rem" }}>
              {isAssignReadOnly ? "Assigned Students" : "Assign Students to Exam"}
            </h2>
            
            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <input
                type="text"
                placeholder="Search students by name or email..."
                className="form-input"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.55rem 0.75rem", fontSize: "0.85rem" }}
              />
            </div>

            {!loadingAssign && !isAssignReadOnly && allStudents.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", padding: "0 0.25rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
                  {assignedStudentIds.length} of {allStudents.length} students selected
                </span>
                <button
                  type="button"
                  style={{ 
                    background: "none", 
                    border: "none", 
                    color: "#4A5FF7", 
                    fontSize: "0.75rem", 
                    fontWeight: 600, 
                    cursor: "pointer", 
                    padding: 0,
                    outline: "none"
                  }}
                  onClick={() => {
                    const filtered = allStudents.filter(s => 
                      s.fullName.toLowerCase().includes(assignSearch.toLowerCase()) ||
                      s.email.toLowerCase().includes(assignSearch.toLowerCase())
                    );
                    const filteredIds = filtered.map(s => s.id);
                    const allFilteredSelected = filteredIds.every(id => assignedStudentIds.includes(id));
                    
                    if (allFilteredSelected) {
                      setAssignedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
                    } else {
                      setAssignedStudentIds(prev => {
                        const newIds = [...prev];
                        filteredIds.forEach(id => {
                          if (!newIds.includes(id)) newIds.push(id);
                        });
                        return newIds;
                      });
                    }
                  }}
                >
                  {allStudents.filter(s => 
                    s.fullName.toLowerCase().includes(assignSearch.toLowerCase()) ||
                    s.email.toLowerCase().includes(assignSearch.toLowerCase())
                  ).every(s => assignedStudentIds.includes(s.id)) ? "Deselect All" : "Select All"}
                </button>
              </div>
            )}

            {isAssignReadOnly && allStudents.length > 0 && (
              <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500, marginBottom: "0.75rem", padding: "0 0.25rem" }}>
                {assignedStudentIds.length} assigned students
              </div>
            )}

            {loadingAssign ? (
              <p style={{ color: "#64748B", textAlign: "center", fontSize: "0.9rem", padding: "1.5rem" }}>Processing assignment records...</p>
            ) : (
              <>
                <div style={{ 
                  maxHeight: "260px", 
                  overflowY: "auto", 
                  border: "1px solid #E2E8F0", 
                  borderRadius: "8px", 
                  padding: "0.5rem", 
                  marginBottom: "1.5rem" 
                }}>
                  {allStudents.filter(s => 
                    s.fullName.toLowerCase().includes(assignSearch.toLowerCase()) ||
                    s.email.toLowerCase().includes(assignSearch.toLowerCase())
                  ).map(s => {
                    const isChecked = assignedStudentIds.includes(s.id);
                    return (
                      <label key={s.id} style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.75rem", 
                        padding: "0.5rem 0.75rem", 
                        borderBottom: "1px solid #F1F5F9", 
                        cursor: isAssignReadOnly ? "default" : "pointer",
                        borderRadius: "6px",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => { if (!isAssignReadOnly) e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
                      onMouseLeave={(e) => { if (!isAssignReadOnly) e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isAssignReadOnly}
                          onChange={() => {
                            if (isChecked) {
                              setAssignedStudentIds(prev => prev.filter(id => id !== s.id));
                            } else {
                              setAssignedStudentIds(prev => [...prev, s.id]);
                            }
                          }}
                          style={{ cursor: isAssignReadOnly ? "default" : "pointer", accentColor: "#4A5FF7" }}
                        />
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0F172A" }}>{s.fullName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{s.email}</div>
                        </div>
                      </label>
                    );
                  })}
                  {allStudents.length === 0 && (
                    <p style={{ color: "#64748B", fontSize: "0.85rem", textAlign: "center", padding: "1rem" }}>No student records found.</p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", fontWeight: 600, border: "1px solid #CBD5E1" }}
                  >
                    {isAssignReadOnly ? "Close" : "Cancel"}
                  </button>
                  {!isAssignReadOnly && (
                    <button
                      onClick={handleSaveAssignment}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", fontWeight: 600, backgroundColor: "#6C4FD6", border: "none" }}
                    >
                      Save Assignments
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
