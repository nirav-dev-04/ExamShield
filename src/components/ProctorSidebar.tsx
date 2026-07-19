import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Eye, FileText, ArrowLeft, LogOut, ChevronLeft, ChevronRight, Activity } from "lucide-react";

interface ProctorSidebarProps {
  examId?: number; // optional so it can be used on the main dashboard too!
  children: React.ReactNode;
}

export function ProctorSidebar({ examId, children }: ProctorSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Load collapse preference from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("proctor_sidebar_collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("proctor_sidebar_collapsed", String(newState));
      return newState;
    });
  };

  // Define menu items dynamically based on whether we are in a specific exam session
  const menuItems = examId 
    ? [
        { name: "Live Monitoring", path: `/proctor/exam/${examId}`, icon: Eye, exact: true },
        { name: "Subjective Grading", path: `/proctor/exam/${examId}/grading`, icon: FileText },
      ]
    : [
        { name: "Dashboard", path: `/proctor/dashboard`, icon: Activity, exact: true },
      ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Collapsible Left Sidebar */}
      <nav 
        style={{
          width: isCollapsed ? "72px" : "240px",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        className="bg-white border-r border-[#E2E8F0] flex flex-col py-8 shrink-0 relative z-20"
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-8 bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#E8A33D] hover:border-[#E8A33D] p-1 rounded-full shadow-sm hover:shadow transition-all z-50 cursor-pointer"
          style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Branding Title */}
        <div 
          onClick={() => navigate("/proctor/dashboard")} 
          className={`px-5 mb-8 flex items-center gap-2.5 overflow-hidden cursor-pointer ${isCollapsed ? "justify-center" : ""}`}
          title="Go to Dashboard"
        >
          <Shield size={24} className="text-[#E8A33D] shrink-0" fill="rgba(232, 163, 61, 0.1)" />
          {!isCollapsed && (
            <div style={{ whiteSpace: "nowrap" }} className="transition-opacity duration-200">
              <h1 className="text-sm font-bold text-[#0F172A]">ExamShield</h1>
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#64748B]">Proctor Console</p>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <div className="flex-1 px-3 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full font-semibold text-xs flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                  isActive 
                    ? "text-[#E8A33D] bg-[#FBF2E2]" 
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.name : undefined}
                style={{ border: "none", cursor: "pointer" }}
              >
                <Icon size={16} className="shrink-0" />
                {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>{item.name}</span>}
              </button>
            );
          })}
        </div>

        {/* Back to Portal and Logout */}
        <div className="px-3 mt-auto flex flex-col gap-1">
          {examId && (
            <button 
              onClick={() => navigate("/proctor/dashboard")}
              className={`w-full text-[#64748B] hover:text-[#0F172A] font-semibold text-xs flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#F8FAFC] rounded-xl text-left transition-colors ${
                isCollapsed ? "justify-center px-0" : ""
              }`}
              title={isCollapsed ? "Exit Session" : undefined}
              style={{ border: "none", cursor: "pointer" }}
            >
              <ArrowLeft size={16} className="shrink-0" />
              {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>Exit Session</span>}
            </button>
          )}
          
          <button 
            onClick={logout}
            className={`w-full text-[#64748B] hover:text-[#EF4444] font-semibold text-xs flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#FEF2F2] rounded-xl text-left transition-colors ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title={isCollapsed ? "Logout" : undefined}
            style={{ border: "none", cursor: "pointer" }}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span style={{ whiteSpace: "nowrap" }}>Logout</span>}
          </button>
        </div>
      </nav>

      {/* Proctor Subview Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
        {children}
      </div>
    </div>
  );
}
