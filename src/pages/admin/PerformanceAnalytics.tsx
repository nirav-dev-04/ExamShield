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
    <div className="layout-container" style={{ height: "100%", overflowY: "auto", padding: "2rem 3rem", scrollBehavior: "smooth" }}>
      <header className="flat-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 className="flat-title" style={{ margin: 0 }}>Exam Performance Analytics</h1>
          <button onClick={onBack} className="btn btn-secondary" style={{ margin: 0 }}>
            Back
          </button>
        </div>
        <p className="flat-subtitle" style={{ margin: 0, marginTop: "0.5rem" }}>
          Review score metrics, pass margins, and standings
        </p>
      </header>

      {loading && <div style={{ color: "var(--fg-secondary)" }}>Loading analytics...</div>}
      {error && <div style={{ color: "var(--state-danger)" }}>{error}</div>}

      {!loading && !error && analytics && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
            <div style={{ padding: "1.5rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.02)" }}>
              <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--fg-secondary)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Total Submissions
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-primary)", fontFamily: "'Outfit', sans-serif" }}>
                {analytics.totalAttempts} candidates
              </div>
            </div>
            <div style={{ padding: "1.5rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.02)" }}>
              <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--fg-secondary)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Average Exam Score
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-primary)", fontFamily: "'Outfit', sans-serif" }}>
                {analytics.averageScore.toFixed(1)} / 100
              </div>
            </div>
            <div style={{ padding: "1.5rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.02)" }}>
              <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--fg-secondary)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Passing Rate
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent-primary)", fontFamily: "'Outfit', sans-serif" }}>
                {analytics.passPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "1.5rem" }}>
              Candidate Standing & Proctor Log
            </h2>
            <div style={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.02)"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", tableLayout: "fixed" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-subtle)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                    <th style={{ width: "80px", padding: "1rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--fg-secondary)", textTransform: "uppercase" }}>Rank</th>
                    <th style={{ width: "180px", padding: "1rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--fg-secondary)", textTransform: "uppercase" }}>Candidate Info</th>
                    <th style={{ width: "130px", padding: "1rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--fg-secondary)", textTransform: "uppercase" }}>Exam Status</th>
                    <th style={{ width: "130px", padding: "1rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--fg-secondary)", textTransform: "uppercase" }}>Infractions</th>
                    <th style={{ width: "220px", padding: "1rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--fg-secondary)", textTransform: "uppercase" }}>Warnings Sent</th>
                    <th style={{ width: "240px", padding: "1rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--fg-secondary)", textTransform: "uppercase" }}>Suspension Log</th>
                    <th style={{ width: "100px", padding: "1rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--fg-secondary)", textTransform: "uppercase", textAlign: "right" }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics.ranks || (analytics as any).toppers || []).map((entry: any, idx: number) => {
                    const isSuspended = entry.status === "SUSPENDED";
                    const isCompleted = entry.status === "SUBMITTED" || entry.status === "AUTO_SUBMITTED";
                    
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background-color 0.2s" }}>
                        {/* Rank */}
                        <td style={{ padding: "1rem 1.5rem", fontWeight: 700, color: entry.rank === 1 ? "var(--state-warning)" : "var(--fg-secondary)" }}>
                          {entry.score != null ? `#${entry.rank || (idx + 1)}` : "-"}
                        </td>
                        {/* Candidate Info */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <div style={{ fontWeight: 600, color: "var(--fg-primary)" }}>{entry.studentName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--fg-secondary)" }}>{entry.enrollmentNo}</div>
                        </td>
                        {/* Exam Status */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          {isSuspended ? (
                            <span style={{ display: "inline-block", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", backgroundColor: "rgba(214, 69, 69, 0.1)", color: "#D64545" }}>
                              Suspended
                            </span>
                          ) : isCompleted ? (
                            <span style={{ display: "inline-block", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", backgroundColor: "rgba(30, 158, 107, 0.1)", color: "#1E9E6B" }}>
                              Completed
                            </span>
                          ) : (
                            <span style={{ display: "inline-block", padding: "0.25rem 0.5rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "6px", backgroundColor: "rgba(232, 163, 61, 0.1)", color: "#E8A33D" }}>
                              Active
                            </span>
                          )}
                        </td>
                        {/* Infractions */}
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <span style={{ 
                            fontSize: "0.8rem", 
                            fontWeight: 600, 
                            color: entry.violationsCount > 0 ? "var(--state-danger)" : "var(--fg-secondary)" 
                          }}>
                            {entry.violationsCount} infraction{entry.violationsCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        {/* Warnings Sent */}
                        <td style={{ padding: "1rem 1.5rem", maxWidth: "250px" }}>
                          {entry.warnings && entry.warnings.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {entry.warnings.map((warn: string, wIdx: number) => (
                                <div key={wIdx} style={{ fontSize: "0.75rem", color: "var(--fg-primary)", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.25rem 0.5rem", borderRadius: "4px", borderLeft: "2px solid var(--state-warning)" }}>
                                  {warn}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "var(--fg-secondary)" }}>No warnings</span>
                          )}
                        </td>
                        {/* Suspension Log */}
                        <td style={{ padding: "1rem 1.5rem", maxWidth: "250px" }}>
                          {isSuspended ? (
                            <div style={{ fontSize: "0.75rem" }}>
                              <div style={{ fontWeight: 600, color: "var(--state-danger)" }}>Suspended by {entry.suspendedBy || "Proctor"}</div>
                              <div style={{ color: "var(--fg-secondary)", marginTop: "0.25rem", fontStyle: "italic" }}>
                                "{entry.proctorNotes || "No comments specified"}"
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "var(--fg-secondary)" }}>-</span>
                          )}
                        </td>
                        {/* Score */}
                        <td style={{ padding: "1rem 1.5rem", textAlign: "right", fontWeight: 700, color: "var(--accent-primary)", fontSize: "1.1rem" }}>
                          {entry.score != null ? Number(entry.score).toFixed(1) : "Pending"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
