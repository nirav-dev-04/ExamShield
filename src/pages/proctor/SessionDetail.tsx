import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../config/axios";
import { ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";

interface ViolationTimelineItem {
  id: number;
  type: string;
  occurredAt: string;
  studentName: string;
  enrollmentNo: string;
}

interface AttemptDetails {
  attemptId: number;
  studentName: string;
  enrollmentNo: string;
  examId: number;
  examTitle: string;
  status: string;
  startedAt: string;
  proctorNotes: string;
  violations: ViolationTimelineItem[];
}

export function SessionDetail() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState<AttemptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notesStatus, setNotesStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<any>(null);

  const fetchAttemptDetails = async () => {
    try {
      const response = await apiClient.get<AttemptDetails>(`/proctor/attempts/${attemptId}`);
      setDetails(response.data);
      setNotes(response.data.proctorNotes || "");
    } catch (e) {
      console.error(e);
      setError("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttemptDetails();
    const interval = setInterval(fetchAttemptDetails, 8000);
    return () => clearInterval(interval);
  }, [attemptId]);

  // Debounced auto-save notes
  const handleNotesChange = (val: string) => {
    setNotes(val);
    setNotesStatus("saving");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await apiClient.post(`/proctor/attempts/${attemptId}/notes`, { notes: val });
        setNotesStatus("saved");
        setTimeout(() => setNotesStatus("idle"), 2000);
      } catch (e) {
        console.error("Failed to save proctor notes", e);
        setNotesStatus("idle");
      }
    }, 1000);
  };

  const handleSendWarning = async () => {
    const message = window.prompt("Enter warning message for student:");
    if (!message) return;
    try {
      await apiClient.post(`/proctor/attempts/${attemptId}/warn`, null, {
        params: { message }
      });
      alert("Warning sent successfully!");
      fetchAttemptDetails();
    } catch (e) {
      console.error(e);
      alert("Failed to send warning.");
    }
  };

  const handleSuspend = async () => {
    if (!window.confirm("Are you absolutely sure you want to suspend this session? This action is irreversible.")) {
      return;
    }
    try {
      await apiClient.post(`/proctor/attempts/${attemptId}/suspend`);
      alert("Session suspended.");
      fetchAttemptDetails();
    } catch (e) {
      console.error(e);
      alert("Failed to suspend session.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F7F8FA]">
        <div className="flex items-center gap-2 text-[#5B6472]">
          <RefreshCw size={24} className="animate-spin text-[#E8A33D]" />
          <span className="font-semibold">Loading session log...</span>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="layout-container py-24 text-center bg-[#F7F8FA] min-h-screen">
        <h2 className="text-xl font-bold text-[#D64545] mb-2">Error Loading Session</h2>
        <p className="text-sm text-[#5B6472] mb-6">{error || "Attempt not found."}</p>
        <button onClick={() => navigate(`/proctor/exam/${examId}`)} className="btn btn-secondary border border-[#E2E5EA]">
          Back to Live Monitor
        </button>
      </div>
    );
  }

  const isLive = details.status === "IN_PROGRESS";

  // Build a consolidated events list
  const events: { id: string; time: string; type: string; title: string; desc: string; severity: "info" | "warning" | "critical" }[] = [];

  // Start event
  if (details.startedAt) {
    events.push({
      id: "started",
      time: details.startedAt,
      type: "SYSTEM",
      title: "Session Started",
      desc: "Candidate started the exam console.",
      severity: "info"
    });
  }

  // Map violations
  details.violations.forEach((v) => {
    let title = v.type;
    let severity: "info" | "warning" | "critical" = "warning";
    let desc = `Infraction detected on client browser.`;

    if (v.type === "TAB_SWITCH") {
      title = "Tab Switched";
      desc = "Browser window lost focus / tab switched.";
      severity = "critical";
    } else if (v.type === "WINDOW_BLUR") {
      title = "Fullscreen Exited";
      desc = "Candidate exited lock mode / screen resized.";
      severity = "warning";
    } else if (v.type === "COPY" || v.type === "PASTE") {
      title = "Copy-Paste Attempt Detected";
      desc = "Clipboard interaction blocked.";
      severity = "critical";
    }

    events.push({
      id: `violation-${v.id}`,
      time: v.occurredAt,
      type: "VIOLATION",
      title,
      desc,
      severity
    });
  });

  // Sort chronologically (oldest first for line timeline, or newest first for log feed). Let's do newest first
  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#E2E5EA] px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/proctor/exam/${examId}`)} 
            className="p-2 hover:bg-gray-50 rounded-lg border border-[#E2E5EA] transition-colors"
          >
            <ArrowLeft size={16} className="text-[#5B6472]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0F1B2E]">Session: {details.examTitle}</h1>
              {isLive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBF2E2] text-[#E8A33D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D] animate-pulse"></span>
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-[#5B6472]">
                  {details.status}
                </span>
              )}
            </div>
            <p className="text-xs text-[#5B6472] mt-0.5">
              Candidate: <span className="font-semibold text-[#0F1B2E]">{details.studentName}</span> • Enrollment: {details.enrollmentNo}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isLive && (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSendWarning} 
              className="px-4 py-2 border border-[#E2E5EA] hover:bg-gray-50 text-[#0F1B2E] font-semibold text-xs rounded-lg transition-colors"
            >
              Send Warning
            </button>
            <button 
              onClick={handleSuspend} 
              className="px-4 py-2 bg-[#D64545] hover:bg-opacity-90 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Suspend Session
            </button>
          </div>
        )}
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto p-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Event Timeline */}
        <div className="flex-1 bg-white border border-[#E2E5EA] rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-sm font-bold text-[#0F1B2E] uppercase tracking-wider mb-6 pb-2 border-b border-[#E2E5EA]">
            Session Audit Feed
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 relative max-h-[600px] min-h-[400px]">
            {events.length === 0 ? (
              <p className="text-sm text-[#5B6472] italic text-center py-12">No system activity logged yet.</p>
            ) : (
              <div className="relative border-l-2 border-[#E2E5EA] ml-3 pl-6 space-y-8 py-2">
                {events.map((ev) => {
                  let badgeBg = "bg-gray-100 text-[#5B6472]";
                  let lineDotBg = "bg-[#E2E5EA]";

                  if (ev.severity === "critical") {
                    badgeBg = "bg-red-50 text-[#D64545]";
                    lineDotBg = "bg-[#D64545]";
                  } else if (ev.severity === "warning") {
                    badgeBg = "bg-[#FBF2E2] text-[#E8A33D]";
                    lineDotBg = "bg-[#E8A33D]";
                  } else if (ev.severity === "info") {
                    badgeBg = "bg-indigo-50 text-[#4A5FF7]";
                    lineDotBg = "bg-[#4A5FF7]";
                  }

                  return (
                    <div key={ev.id} className="relative">
                      {/* Timeline dot */}
                      <span 
                        className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center ${lineDotBg}`}
                        style={{ width: "16px", height: "16px" }}
                      />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#5B6472]">
                              {new Date(ev.time).toLocaleTimeString()}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${badgeBg}`}>
                              {ev.title}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-[#0F1B2E] mt-1">{ev.title}</h3>
                          <p className="text-xs text-[#5B6472] mt-0.5">{ev.desc}</p>
                        </div>

                        {/* Interactive Warning / Dismiss buttons for violations */}
                        {ev.type === "VIOLATION" && isLive && (
                          <div className="flex gap-1.5">
                            <button 
                              onClick={handleSendWarning}
                              className="px-2.5 py-1 text-[10px] font-bold border border-[#E2E5EA] text-[#5B6472] hover:bg-gray-50 rounded transition-colors"
                            >
                              Warn Candidate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Proctor Notes */}
        <div className="w-full md:w-[400px] shrink-0 bg-white border border-[#E2E5EA] rounded-xl p-6 shadow-sm flex flex-col h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-[#0F1B2E] uppercase tracking-wider">
              Proctor Notes
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-[#5B6472]">
              {notesStatus === "saving" && (
                <>
                  <RefreshCw size={12} className="animate-spin text-[#E8A33D]" />
                  <span>Saving...</span>
                </>
              )}
              {notesStatus === "saved" && (
                <>
                  <CheckCircle size={12} className="text-[#1E9E6B]" />
                  <span className="text-[#1E9E6B]">Saved just now</span>
                </>
              )}
            </div>
          </div>
          
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Type observations about candidate actions here. Notes are automatically saved..."
            className="w-full h-[320px] p-3 text-sm text-[#0F1B2E] border border-[#E2E5EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FBF2E2] focus:border-[#E8A33D] resize-none transition-all placeholder:text-[#5B6472]/60"
            disabled={!isLive}
          />
          <div className="mt-4 flex items-center justify-between text-xs text-[#5B6472]">
            <span>Last sync: Real-time</span>
            <span className="italic">Proctors can write notes during live sessions.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
