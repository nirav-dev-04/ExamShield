import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { apiClient } from "../../config/axios";
import type { LiveCandidateDTO, ViolationResponseDTO } from "../../types/proctor";

interface LiveDashboardProps {
  examId: number;
  onViewGrading: () => void;
  onBack: () => void;
}

export function LiveDashboard({ examId, onViewGrading, onBack }: LiveDashboardProps) {
  const [candidates, setCandidates] = useState<LiveCandidateDTO[]>([]);
  const [violations, setViolations] = useState<ViolationResponseDTO[]>([]);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const stompClientRef = useRef<Client | null>(null);

  const fetchLiveCandidates = async () => {
    try {
      const response = await apiClient.get<LiveCandidateDTO[]>(`/proctor/exams/${examId}/live-students`);
      setCandidates(response.data);
    } catch (e) {
      console.error("Failed to load candidate list", e);
    }
  };

  const handleOfflineSync = async () => {
    try {
      const response = await apiClient.get<ViolationResponseDTO[]>(
        `/proctor/exams/${examId}/violations`,
        { params: { since: lastSyncTimeRef.current } }
      );
      if (response.data.length > 0) {
        setViolations((prev) => [...response.data, ...prev]);
        lastSyncTimeRef.current = Date.now();
        fetchLiveCandidates();
      }
    } catch (e) {
      console.error("Offline recovery sync failed", e);
    }
  };

  useEffect(() => {
    fetchLiveCandidates();

    const socket = new SockJS("/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") || "",
      },
      onConnect: () => {
        client.subscribe(`/topic/exam/${examId}/violations`, (message) => {
          const payload: ViolationResponseDTO = JSON.parse(message.body);
          setViolations((prev) => [payload, ...prev]);
          lastSyncTimeRef.current = Date.now();
          
          setCandidates((prev) =>
            prev.map((c) =>
              c.attemptId === payload.attemptId
                ? { ...c, violationsCount: c.violationsCount + 1 }
                : c
            )
          );
        });
      },
      onDisconnect: () => {
        handleOfflineSync();
      },
    });

    client.activate();
    stompClientRef.current = client;

    const backupInterval = setInterval(handleOfflineSync, 10000);

    return () => {
      client.deactivate();
      clearInterval(backupInterval);
    };
  }, [examId]);

  return (
    <div className="layout-container">
      <header className="flat-header">
        <div>
          <h1 className="flat-title">Proctor Monitoring Console</h1>
          <p className="flat-subtitle">Active Exam Session ID: {examId}</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={onViewGrading} className="btn btn-primary">
            Subjective Grading Queue
          </button>
          <button onClick={onBack} className="btn btn-secondary">
            Exit Session
          </button>
        </div>
      </header>

      <div style={{ display: "flex", gap: "3rem", marginTop: "2rem" }}>
        
        {/* Active Candidates List */}
        <div style={{ flex: 1.2 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "1.25rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-subtle)" }}>
            Candidate Status Dashboard
          </h2>
          <div className="list-rows">
            <div className="flat-row" style={{ fontWeight: 600, borderBottom: "2px solid var(--border-subtle)", backgroundColor: "var(--bg-secondary)" }}>
              <span>Name / Enrollment</span>
              <span>Attempt Status</span>
              <span>Violations Tracker</span>
            </div>
            {candidates.length === 0 && (
              <div style={{ color: "var(--fg-secondary)", padding: "1.5rem 0.5rem" }}>
                No students currently in progress for this exam.
              </div>
            )}
            {candidates.map((c) => (
              <div key={c.attemptId} className="flat-row">
                <div>
                  <div style={{ fontWeight: 500 }}>{c.studentName}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--fg-secondary)" }}>{c.enrollmentNo}</div>
                </div>
                <div>
                  <span className={`status-badge state-${c.status.toLowerCase()}`}>{c.status}</span>
                </div>
                <div style={{ fontWeight: 600, color: c.violationsCount > 0 ? "var(--state-danger)" : "var(--fg-secondary)" }}>
                  {c.violationsCount} infractions
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Violation Feed */}
        <div style={{ flex: 0.8, borderLeft: "1px solid var(--border-subtle)", paddingLeft: "3rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--fg-primary)", marginBottom: "1.25rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-subtle)" }}>
            Live Security Timeline
          </h2>
          {violations.length === 0 && (
            <div style={{ color: "var(--fg-secondary)", padding: "1.5rem 0" }}>
              No infractions recorded yet.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "500px", overflowY: "auto" }}>
            {violations.map((v) => (
              <div key={v.id} style={{ display: "flex", flexDirection: "column", padding: "0.75rem", borderBottom: "1px dashed var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--fg-secondary)" }}>
                  <span>{new Date(v.occurredAt).toLocaleTimeString()}</span>
                  <span style={{ fontWeight: 600, color: "var(--state-danger)" }}>{v.type}</span>
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.25rem" }}>
                  {v.studentName} ({v.enrollmentNo})
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function getCookie(name: string): string | null {
  const matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : null;
}
