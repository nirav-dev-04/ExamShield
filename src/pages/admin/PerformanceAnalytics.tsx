import { useEffect, useState } from "react";
import { apiClient } from "../../config/axios";
import type { ExamAnalyticsDTO } from "../../types/admin";

interface PerformanceAnalyticsProps {
  examId: number;
  onBack: () => void;
}

export function PerformanceAnalytics({ examId, onBack }: PerformanceAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ExamAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get<ExamAnalyticsDTO>(`/admin/exams/${examId}/analytics`);
        setAnalytics(response.data);
      } catch (err: any) {
        setError("Failed to load performance analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [examId]);

  return (
    <div className="layout-container">
      <header className="flat-header">
        <div>
          <h1 className="flat-title">Exam Performance Analytics</h1>
          <p className="flat-subtitle">Review score metrics, pass margins, and standings</p>
        </div>
        <button onClick={onBack} className="btn btn-secondary">
          Back
        </button>
      </header>

      {loading && <div style={{ color: "var(--fg-secondary)" }}>Loading analytics...</div>}
      {error && <div style={{ color: "var(--state-danger)" }}>{error}</div>}

      {!loading && !error && analytics && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "2rem", marginBottom: "2.5rem" }}>
            <div style={{ padding: "0 1rem" }}>
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--fg-secondary)", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                Total Submissions
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                {analytics.totalAttempts} candidates
              </div>
            </div>
            <div style={{ padding: "0 1rem", borderLeft: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--fg-secondary)", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                Average Exam Score
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                {analytics.averageScore.toFixed(1)} / 100
              </div>
            </div>
            <div style={{ padding: "0 1rem", borderLeft: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--fg-secondary)", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                Passing Rate
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent-primary)" }}>
                {analytics.passPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "1.5rem" }}>
              Standings & Rankings
            </h2>
            <div className="list-rows">
              <div className="flat-row" style={{ fontWeight: 600, borderBottom: "2px solid var(--border-subtle)", backgroundColor: "var(--bg-secondary)" }}>
                <span>Rank</span>
                <span>Candidate Name</span>
                <span style={{ textAlign: "right" }}>Total Score</span>
              </div>
              {analytics.ranks.map((entry, idx) => (
                <div key={idx} className="flat-row">
                  <span style={{ fontWeight: 700, color: entry.rank === 1 ? "var(--state-warning)" : "var(--fg-secondary)" }}>
                    #{entry.rank}
                  </span>
                  <span>{entry.studentName}</span>
                  <span style={{ textAlign: "right", fontWeight: 600, color: "var(--accent-primary)" }}>
                    {entry.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
