import { useState, useEffect } from "react";
import { apiClient } from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { 
  BookOpen, 
  Users, 
  AlertTriangle, 
  Activity, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle, 
  TrendingUp,
  Clock,
  User,
  Shield,
  FileText
} from "lucide-react";

interface RecentActivityItem {
  id: number;
  studentName: string;
  examTitle: string;
  type: string;
  occurredAt: string;
}

interface DashboardStats {
  totalExams: number;
  totalStudents: number;
  totalProctors: number;
  totalViolations: number;
  recentActivity: RecentActivityItem[];
}

export function DashboardOverview() {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<DashboardStats>("/admin/dashboard/stats");
      setStats(response.data);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await apiClient.get<DashboardStats>("/admin/dashboard/stats");
      setStats(response.data);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch dashboard metrics.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getFriendlyViolationType = (type: string) => {
    if (type === "TAB_SWITCH") return "Tab Switched";
    if (type === "WINDOW_BLUR") return "Fullscreen Exited";
    if (type === "COPY" || type === "PASTE") return "Clipboard Action Blocked";
    return type.replace(/_/g, " ");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#E2E8F0] h-16 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="relative w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search exams, candidates, violations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#4A5FF7] focus:ring-1 focus:ring-[#4A5FF7] transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div style={{ textAlign: "right" }}>
            <div className="text-xs font-bold text-[#0F172A]">{user?.fullName || "Administrator"}</div>
            <div className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">{user?.role === "SUPER_ADMIN" ? "Super Admin" : "System Admin"}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EEF0FF] text-[#4A5FF7] flex items-center justify-center text-xs font-bold border border-rgba(74,95,247,0.1)">
            {getInitials(user?.fullName || "Admin User")}
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-grow overflow-y-auto p-8">
        <div className="max-w-[1250px] mx-auto">
          {/* Title Row */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">System Console Overview</h2>
              <p className="text-sm text-[#64748B] mt-0.5">Real-time statistics, violation counts, and secure activity logs.</p>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] rounded-lg transition-all text-[#334155] flex items-center gap-2 text-xs font-bold disabled:opacity-55 shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-[#4A5FF7]" : ""} />
              {refreshing ? "Refreshing Data..." : "Refresh Stats"}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 gap-3">
              <RefreshCw size={32} className="animate-spin text-[#4A5FF7]" />
              <p className="text-sm font-semibold text-[#64748B]">Loading administrative records...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#FEF2F2] text-[#EF4444] border border-[#FEE2E2] rounded-lg text-sm font-medium">
              {error}
            </div>
          ) : !stats ? (
            <div className="text-center py-12 text-[#64748B] font-medium">No dashboard statistics found.</div>
          ) : (
            <>
              {/* 4-Metric Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stat 1: Total Exams */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#F1EDFB] flex items-center justify-center text-[#6C4FD6]">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Scheduled</p>
                    <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1">{stats.totalExams} Exams</h3>
                  </div>
                </div>

                {/* Stat 2: Total Students */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#EEF0FF] flex items-center justify-center text-[#4A5FF7]">
                    <Users size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Registered</p>
                    <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1">{stats.totalStudents} Students</h3>
                  </div>
                </div>

                {/* Stat 3: Total Violations */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.totalViolations > 0 ? "bg-[#FEF2F2] text-[#EF4444]" : "bg-emerald-50 text-emerald-600"}`}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Infractions Caught</p>
                    <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1">{stats.totalViolations} Flags</h3>
                  </div>
                </div>

                {/* Stat 4: System Health */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#137333]">
                    <Activity size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Integrity Engine</p>
                    <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1">100% Secure</h3>
                  </div>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[#F1F5F9]">
                  <ShieldAlert size={18} className="text-[#64748B]" />
                  <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                    Recent Security Violations & Infractions (Live Audit Log)
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[10px] font-bold text-[#475569] uppercase tracking-wider bg-[#F8FAFC]">
                        <th className="py-3.5 px-5">Timestamp</th>
                        <th className="py-3.5 px-5">Candidate</th>
                        <th className="py-3.5 px-5">Exam Context</th>
                        <th className="py-3.5 px-5">Security Infraction Type</th>
                        <th className="py-3.5 px-5 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-[#0F172A]">
                      {(() => {
                        const filteredActivity = stats.recentActivity.filter((activity) => {
                          const query = searchQuery.toLowerCase();
                          return (
                            activity.studentName.toLowerCase().includes(query) ||
                            activity.examTitle.toLowerCase().includes(query) ||
                            getFriendlyViolationType(activity.type).toLowerCase().includes(query)
                          );
                        });

                        if (filteredActivity.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-[#64748B] font-medium italic bg-[#FFFFFF]">
                                {searchQuery ? "No matching security infractions found." : "No security infractions recorded in the audit log."}
                              </td>
                            </tr>
                          );
                        }

                        return filteredActivity.map((activity) => (
                          <tr key={activity.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]/50 transition-colors">
                            <td className="py-3.5 px-5 text-[#64748B] font-medium flex items-center gap-1.5">
                              <Clock size={12} />
                              {new Date(activity.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="py-3.5 px-5 font-semibold text-[#0F172A]">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#4A5FF7]" />
                                {activity.studentName}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-[#475569] font-medium">
                              {activity.examTitle}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#EF4444] border border-[#FEE2E2]">
                                {getFriendlyViolationType(activity.type)}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#EF4444]">
                                Flagged
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
