import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { apiClient } from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { 
  Shield, Eye, ShieldAlert, BookOpen, FileText, 
  LogOut, Wifi, WifiOff, Maximize2, Menu
} from "lucide-react";
import type { LiveCandidateDTO, ViolationResponseDTO } from "../../types/proctor";

interface LiveDashboardProps {
  examId: number;
  onViewGrading: () => void;
  onBack: () => void;
}

export function LiveDashboard({ examId, onViewGrading, onBack }: LiveDashboardProps) {
  const { logout } = useAuth();

  interface StudentTrack {
    attemptId: number;
    currentQuestionIndex: number;
    currentQuestionText: string;
    answeredCount: number;
    totalQuestions: number;
    lastAction: string;
    questionStatusMap: { [key: number]: string };
  }

  const [candidates, setCandidates] = useState<LiveCandidateDTO[]>([]);
  const [liveTracks, setLiveTracks] = useState<{ [attemptId: number]: StudentTrack }>({});
  const [examName, setExamName] = useState<string>("Active Exam");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  
  const lastSyncTimeRef = useRef<number>(Date.now());
  const stompClientRef = useRef<Client | null>(null);

  // Load exam metadata
  useEffect(() => {
    const fetchExamMeta = async () => {
      try {
        const response = await apiClient.get<any>(`/proctor/exams`);
        const found = response.data.find((e: any) => e.id === examId);
        if (found) {
          setExamName(found.title);
        }
      } catch (e) {
        console.error("Failed to load exam metadata", e);
      }
    };
    fetchExamMeta();
  }, [examId]);

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
        lastSyncTimeRef.current = Date.now();
        fetchLiveCandidates();
      }
    } catch (e) {
      console.error("Offline recovery sync failed", e);
    }
  };

  const handleWarn = async (attemptId: number, name: string) => {
    const message = window.prompt(`Enter warning message for student ${name}:`);
    if (!message) return;
    try {
      await apiClient.post(`/proctor/attempts/${attemptId}/warn`, null, {
        params: { message }
      });
      alert(`Warning sent to ${name}!`);
      fetchLiveCandidates();
    } catch (e: any) {
      console.error(e);
      const backendMsg = e.response?.data?.message || e.response?.data?.detail || "Failed to send warning.";
      alert(`Warning failed: ${backendMsg}`);
      fetchLiveCandidates();
    }
  };

  const handleSuspend = async (attemptId: number, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to suspend candidate ${name}'s exam attempt?`)) {
      return;
    }
    try {
      await apiClient.post(`/proctor/attempts/${attemptId}/suspend`);
      alert(`Session for ${name} has been suspended.`);
      fetchLiveCandidates();
    } catch (e: any) {
      console.error(e);
      const backendMsg = e.response?.data?.message || e.response?.data?.detail || "Failed to suspend student attempt.";
      alert(`Suspend failed: ${backendMsg}`);
      fetchLiveCandidates();
    }
  };

  const handleReactivate = async (attemptId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to reactivate candidate ${name}'s suspended attempt? This will restore their exam session.`)) {
      return;
    }
    try {
      await apiClient.post(`/proctor/attempts/${attemptId}/reactivate`);
      alert(`Session for ${name} has been reactivated!`);
      fetchLiveCandidates();
    } catch (e: any) {
      console.error(e);
      const backendMsg = e.response?.data?.message || e.response?.data?.detail || "Failed to reactivate attempt.";
      alert(`Reactivation failed: ${backendMsg}`);
      fetchLiveCandidates();
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
          lastSyncTimeRef.current = Date.now();
          
          setCandidates((prev) =>
            prev.map((c) =>
              c.attemptId === payload.attemptId
                ? { ...c, violationsCount: c.violationsCount + 1 }
                : c
            )
          );

          // Re-fetch full list after a short delay to catch status changes (auto-suspend)
          setTimeout(() => fetchLiveCandidates(), 500);
        });

        client.subscribe(`/topic/exam/${examId}/track`, (message) => {
          const payload = JSON.parse(message.body);
          setLiveTracks((prev) => ({
            ...prev,
            [payload.attemptId]: payload
          }));
        });
      },
      onDisconnect: () => {
        handleOfflineSync();
      },
    });

    client.activate();
    stompClientRef.current = client;

    // Periodic full-refresh every 10s to catch any missed state changes
    const refreshInterval = setInterval(() => {
      fetchLiveCandidates();
    }, 10000);

    const backupInterval = setInterval(handleOfflineSync, 10000);

    return () => {
      client.deactivate();
      clearInterval(refreshInterval);
      clearInterval(backupInterval);
    };
  }, [examId]);

  return (
    <div className="flex-grow flex flex-col overflow-hidden h-full">
        {/* Top Control Bar */}
        <header className="bg-white border-b border-[#E2E5EA] px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 hover:bg-gray-50 rounded border border-[#E2E5EA]"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#0F1B2E]">Live Monitoring</h1>
              <p className="text-xs text-[#5B6472] mt-0.5">
                Actively monitoring {candidates.length} session{candidates.length !== 1 ? 's' : ''} for {examName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select className="bg-gray-50 border border-[#E2E5EA] text-xs font-semibold text-[#0F1B2E] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#E8A33D]">
              <option value="all">All Active Exams</option>
              <option value="current">{examName}</option>
            </select>
          </div>
        </header>

        {/* Scrollable Grid Canvas */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1200px] w-full mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {candidates.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <Eye size={48} className="text-[#E2E5EA] mb-4" />
                  <h3 className="text-lg font-bold text-[#0F1B2E] mb-1">No Active Sessions</h3>
                  <p className="text-sm text-[#5B6472]">No students are currently taking this exam. Sessions will appear here in real-time.</p>
                </div>
              )}

              {candidates.map((c) => {
                const isActive = c.status === "IN_PROGRESS";
                const isSuspended = c.status === "SUSPENDED";
                const isSubmitted = c.status === "SUBMITTED" || c.status === "AUTO_SUBMITTED";

                return (
                  <div
                    key={c.attemptId}
                    className={`bg-white rounded-xl overflow-hidden shadow-sm flex flex-col relative transition-all group ${
                      isSuspended
                        ? "border-2 border-[#D64545] opacity-75"
                        : isSubmitted
                        ? "border border-[#E2E5EA] opacity-60"
                        : "border border-[#E2E5EA] hover:border-[#E8A33D]"
                    }`}
                  >
                    {/* Status Banner for suspended/submitted */}
                    {isSuspended && (
                      <div className="bg-[#D64545] text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert size={12} />
                        <span>Suspended</span>
                      </div>
                    )}
                    {isSubmitted && (
                      <div className="bg-[#5B6472] text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert size={12} />
                        <span>Submitted</span>
                      </div>
                    )}

                    {/* Candidate feed area */}
                    {/* Candidate feed area */}
                    <div className="h-[160px] relative flex overflow-hidden border-b border-[#E2E5EA]">
                      {/* If track data exists, display the live dashboard feed simulation */}
                      {liveTracks[c.attemptId] ? (
                        (() => {
                          const track = liveTracks[c.attemptId];
                          return (
                            <div className="w-full h-full bg-[#0F1B2E] text-white p-4 flex flex-col justify-between select-none font-sans">
                              {/* Question Header & Action text */}
                              <div className="flex flex-col gap-1 overflow-hidden">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    Question {track.currentQuestionIndex + 1} of {track.totalQuestions}
                                  </span>
                                  <span className="text-[9px] text-[#E8A33D] font-bold animate-pulse flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-[#E8A33D] animate-ping"></span>
                                    LIVE
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-200 line-clamp-2 font-medium leading-normal italic h-[32px] overflow-hidden mt-0.5">
                                  "{track.currentQuestionText || 'No question details available'}"
                                </p>
                              </div>

                              {/* Live Action Tracker */}
                              <div className="text-[10px] text-gray-400 font-semibold truncate border-t border-gray-800 pt-1.5">
                                Action: <span className="text-gray-200 font-normal">{track.lastAction}</span>
                              </div>

                              {/* Question Grid Map & Progress Bar */}
                              <div className="flex items-center justify-between gap-3 mt-1">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-[9px] text-gray-400 mb-0.5">
                                    <span>Progress</span>
                                    <span className="font-bold text-white">
                                      {Math.round((track.answeredCount / track.totalQuestions) * 100)}% ({track.answeredCount}/{track.totalQuestions})
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-[#E8A33D] h-full transition-all duration-500" 
                                      style={{ width: `${(track.answeredCount / track.totalQuestions) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Tiny Status Indicator Grid */}
                                <div className="flex items-center gap-0.5 max-w-[90px] overflow-hidden shrink-0">
                                  {Array.from({ length: track.totalQuestions }).map((_, idx) => {
                                    const status = track.questionStatusMap[idx];
                                    const isCurrent = status === "CURRENT";
                                    const isAnswered = status === "ANSWERED";
                                    
                                    return (
                                      <div 
                                        key={idx}
                                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                          isCurrent 
                                            ? "bg-[#E8A33D] scale-125 ring-1 ring-white/50 animate-pulse" 
                                            : isAnswered 
                                            ? "bg-[#1E9E6B]" 
                                            : "bg-gray-700"
                                        }`}
                                        title={`Question ${idx + 1}`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        /* Initializing/Offline feed state */
                        <div className="w-full h-full bg-[#1A2638] text-white p-4 flex flex-col items-center justify-center select-none text-center">
                          <div className="p-2.5 bg-[#0F1B2E] rounded-full text-gray-400 mb-2 animate-pulse">
                            <BookOpen size={20} className="text-[#E8A33D]" />
                          </div>
                          <span className="text-[11px] font-bold text-gray-300">Initializing Exam Feed...</span>
                          <p className="text-[9px] text-gray-400 mt-1">Waiting for candidate action inside the console.</p>
                        </div>
                      )}

                      {/* Status badge overlaid on top for Suspended / Completed */}
                      {isSuspended && (
                        <div className="absolute top-3 left-3 bg-[#D64545] text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10">
                          SUSPENDED
                        </div>
                      )}
                      {isSubmitted && (
                        <div className="absolute top-3 left-3 bg-[#5B6472] text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10">
                          DONE
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-[#0F1B2E]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity z-20">
                        <Link
                          to={`/proctor/exam/${examId}/attempt/${c.attemptId}`}
                          className="p-2 bg-white text-[#0F1B2E] rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Maximize2 size={16} />
                        </Link>
                      </div>
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#0F1B2E]">{c.studentName}</h3>
                        <p className="text-[11px] text-[#5B6472] mt-0.5">{examName}</p>
                        <div className={`flex items-center gap-1 mt-2 text-[10px] ${
                          isSuspended ? "text-[#D64545]" : isSubmitted ? "text-[#5B6472]" : "text-[#5B6472]"
                        }`}>
                          {isActive ? (
                            <>
                              <Wifi size={12} className="text-[#1E9E6B]" />
                              <span>Connected • {c.violationsCount} infraction{c.violationsCount !== 1 ? 's' : ''}</span>
                            </>
                          ) : isSuspended ? (
                            <>
                              <ShieldAlert size={12} />
                              <span>Suspended • {c.violationsCount} infraction{c.violationsCount !== 1 ? 's' : ''}</span>
                            </>
                          ) : (
                            <>
                              <WifiOff size={12} />
                              <span>Completed • {c.violationsCount} infraction{c.violationsCount !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-[#E2E5EA] mt-4 pt-3 flex justify-end gap-2">
                        {isActive ? (
                          <>
                            <button
                              onClick={() => handleWarn(c.attemptId, c.studentName)}
                              className="px-3 py-1 border border-[#E2E5EA] hover:border-[#E8A33D] text-[#5B6472] hover:text-[#E8A33D] text-xs font-bold rounded transition-colors"
                            >
                              Warn
                            </button>
                            <button
                              onClick={() => handleSuspend(c.attemptId, c.studentName)}
                              className="px-3 py-1 border border-[#D64545] text-[#D64545] hover:bg-red-50 text-xs font-bold rounded transition-colors"
                            >
                              Suspend
                            </button>
                          </>
                        ) : isSuspended ? (
                          <>
                            <button
                              onClick={() => handleReactivate(c.attemptId, c.studentName)}
                              className="px-3 py-1 bg-[#1E9E6B] text-white hover:bg-[#1E9E6B]/90 text-xs font-bold rounded transition-colors shadow-sm"
                            >
                              Re-activate
                            </button>
                          </>
                        ) : (
                          <>
                            <button disabled className="px-3 py-1 border border-gray-200 text-gray-400 text-xs font-bold rounded cursor-not-allowed">
                              Warn
                            </button>
                            <button disabled className="px-3 py-1 border border-gray-200 text-gray-400 text-xs font-bold rounded cursor-not-allowed">
                              Suspend
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

      {/* Mobile Menu Side Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative bg-white w-64 h-full flex flex-col py-8 px-6 shadow-xl animate-slide-in">
            <div className="flex items-center gap-2 mb-8">
              <Shield size={24} className="text-[#E8A33D]" />
              <span className="text-md font-bold text-[#0F1B2E]">ExamShield</span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <button onClick={() => { setActiveTab("live"); setMobileMenuOpen(false); }} className="w-full text-[#E8A33D] bg-[#FBF2E2] font-semibold text-sm flex items-center gap-3 px-4 py-2 rounded-lg text-left">
                Live Monitoring
              </button>
              <button onClick={onBack} className="w-full text-[#5B6472] font-semibold text-sm flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-lg text-left">
                Dashboard
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Bottom Nav Bar (Mobile Only) */}
      <div className="md:hidden bg-white border-t border-[#E2E5EA] h-16 flex items-center justify-around shrink-0 z-40">
        <button onClick={() => setActiveTab("live")} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === "live" ? "text-[#E8A33D]" : "text-[#5B6472]"}`}>
          <Eye size={18} />
          <span>Live</span>
        </button>
        <button onClick={onBack} className="flex flex-col items-center gap-1 text-[10px] font-bold text-[#5B6472]">
          <BookOpen size={18} />
          <span>Dashboard</span>
        </button>
        <button onClick={onViewGrading} className="flex flex-col items-center gap-1 text-[10px] font-bold text-[#5B6472]">
          <FileText size={18} />
          <span>Grading</span>
        </button>
        <button onClick={logout} className="flex flex-col items-center gap-1 text-[10px] font-bold text-[#5B6472]">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
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
