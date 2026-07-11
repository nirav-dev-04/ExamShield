import { useEffect, useState } from "react";
import { apiClient } from "../../config/axios";
import type { Exam } from "../../types/exam";

interface ExamListProps {
  onStartExam: (examId: number) => void;
}

export function ExamList({ onStartExam }: ExamListProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await apiClient.get<Exam[]>("/student/exams");
        setExams(response.data);
      } catch (err: any) {
        setError("Failed to fetch available exams.");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="layout-container">
      <header className="flat-header">
        <div>
          <h1 className="flat-title">Available Examinations</h1>
          <p className="flat-subtitle">Select an exam to begin your attempt</p>
        </div>
      </header>

      {loading && <div style={{ color: "var(--fg-secondary)" }}>Loading exams...</div>}
      {error && <div style={{ color: "var(--state-danger)" }}>{error}</div>}

      {!loading && !error && exams.length === 0 && (
        <div style={{ color: "var(--fg-secondary)", padding: "2rem 0" }}>
          No exams are currently active or published.
        </div>
      )}

      {!loading && !error && exams.length > 0 && (
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
    </div>
  );
}
