import { useState, useEffect } from "react";
import { apiClient } from "../../config/axios";
import type { Exam } from "../../types/exam";

interface ExamManagerProps {
  onViewAnalytics: (examId: number) => void;
  onViewQuestionPool: (examId: number) => void;
}

export function ExamManager({ onViewAnalytics, onViewQuestionPool }: ExamManagerProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchExams = async () => {
    try {
      const response = await apiClient.get<Exam[]>("/student/exams");
      setExams(response.data);
    } catch (err) {
      setError("Failed to fetch exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/admin/exams", {
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
      });
      alert("Exam draft created successfully!");
      setTitle("");
      setStartTime("");
      setEndTime("");
      fetchExams();
    } catch (err) {
      console.error(err);
      alert("Failed to create exam. Verify parameters.");
    }
  };

  const handlePublish = async (examId: number) => {
    try {
      await apiClient.post(`/admin/exams/${examId}/publish`);
      alert("Exam published successfully! Question pool locked.");
      fetchExams();
    } catch (err) {
      console.error(err);
      alert("Failed to publish exam.");
    }
  };

  return (
    <div className="layout-container">
      <header className="flat-header">
        <div>
          <h1 className="flat-title">Exam Management Dashboard</h1>
          <p className="flat-subtitle">Construct drafts, edit sections, and lock question pools</p>
        </div>
      </header>

      {error && <div style={{ color: "var(--state-danger)", marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: "3rem" }}>
        
        <div style={{ flex: 0.8, backgroundColor: "var(--bg-secondary)", padding: "2rem", borderRadius: "4px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem" }}>Create New Exam (Draft Mode)</h2>
          <form onSubmit={handleCreateExam}>
            <div className="form-group">
              <label className="form-label">Exam Title</label>
              <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="datetime-local" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input type="datetime-local" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Duration (m)</label>
                <input type="number" className="form-input" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Questions</label>
                <input type="number" className="form-input" value={totalQuestions} onChange={(e) => setTotalQuestions(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Passing Marks</label>
                <input type="number" className="form-input" value={passingMarks} onChange={(e) => setPassingMarks(parseInt(e.target.value))} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Easy Count</label>
                <input type="number" className="form-input" value={easyCount} onChange={(e) => setEasyCount(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Medium Count</label>
                <input type="number" className="form-input" value={mediumCount} onChange={(e) => setMediumCount(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Hard Count</label>
                <input type="number" className="form-input" value={hardCount} onChange={(e) => setHardCount(parseInt(e.target.value))} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Grace Period (m)</label>
                <input type="number" className="form-input" value={lateEntryMinutes} onChange={(e) => setLateEntryMinutes(parseInt(e.target.value))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Max Violations</label>
                <input type="number" className="form-input" value={maxViolations} onChange={(e) => setMaxViolations(parseInt(e.target.value))} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
              Create Exam Draft
            </button>
          </form>
        </div>

        <div style={{ flex: 1.2 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem" }}>Active & Draft Exams</h2>
          {loading ? (
            <div>Loading exams...</div>
          ) : (
            <div className="list-rows">
              {exams.map((exam) => (
                <div key={exam.id} className="flat-row" style={{ gridTemplateColumns: "2fr 1fr 1.5fr" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{exam.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--fg-secondary)" }}>
                      Window: {new Date(exam.startTime).toLocaleString()} - {new Date(exam.endTime).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className={`status-badge state-${exam.isPublished ? "submitted" : "auto_submitted"}`}>
                      {exam.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    {!exam.isPublished && (
                      <>
                        <button onClick={() => onViewQuestionPool(exam.id)} className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>
                          Pool
                        </button>
                        <button onClick={() => handlePublish(exam.id)} className="btn btn-primary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", backgroundColor: "var(--accent-primary)" }}>
                          Publish
                        </button>
                      </>
                    )}
                    {exam.isPublished && (
                      <button onClick={() => onViewAnalytics(exam.id)} className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>
                        Analytics
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
