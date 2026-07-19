import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Shield, 
  ArrowRight, 
  Monitor, 
  Users, 
  Settings, 
  Lock,
  ChevronDown,
  BookOpen,
  Eye,
  Activity
} from "lucide-react";

export function Home() {
  const { user } = useAuth();
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStaffDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Redirect authenticated users to their respective dashboards
  if (user) {
    if (user.role === "STUDENT") {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user.role === "PROCTOR") {
      return <Navigate to="/proctor/dashboard" replace />;
    } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#F8FAFC", 
      color: "#0F172A",
      fontFamily: "var(--font-family)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Premium Navbar */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "1.25rem 3rem", 
        borderBottom: "1px solid #E2E8F0",
        backgroundColor: "#FFFFFF",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
      }}>
        <div style={{ fontWeight: 700, fontSize: "1.35rem", color: "#4A5FF7", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Shield size={26} fill="rgba(74, 95, 247, 0.1)" />
          <span>ExamShield</span>
        </div>
        
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link 
            to="/student/login" 
            className="btn btn-secondary" 
            style={{ 
              padding: "0.55rem 1.4rem", 
              fontSize: "0.85rem", 
              fontWeight: 600, 
              border: "1px solid #CBD5E1",
              color: "#334155",
              borderRadius: "8px"
            }}
          >
            Student Login
          </Link>

          {/* Professional Staff Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button 
              onClick={() => setShowStaffDropdown(!showStaffDropdown)} 
              className="btn btn-primary" 
              style={{ 
                padding: "0.55rem 1.4rem", 
                fontSize: "0.85rem", 
                fontWeight: 600,
                backgroundColor: "#0F172A", 
                color: "#FFFFFF",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                border: "none",
                cursor: "pointer"
              }}
            >
              Staff Console
              <ChevronDown size={14} style={{ transform: showStaffDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {showStaffDropdown && (
              <div style={{
                position: "absolute",
                right: 0,
                marginTop: "0.6rem",
                width: "240px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                padding: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                zIndex: 1000
              }}>
                <Link 
                  to="/proctor/login" 
                  onClick={() => setShowStaffDropdown(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#334155",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Eye size={16} className="text-[#E8A33D]" />
                  <div>
                    <div style={{ color: "#0F172A" }}>Proctor Login</div>
                    <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 400 }}>Monitor live attempts</span>
                  </div>
                </Link>

                <Link 
                  to="/admin/login" 
                  onClick={() => setShowStaffDropdown(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#334155",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F1F5F9"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <Settings size={16} className="text-[#6C4FD6]" />
                  <div>
                    <div style={{ color: "#0F172A" }}>Admin Operations</div>
                    <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 400 }}>Manage system & exams</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        padding: "6rem 2rem 5rem 2rem", 
        textAlign: "center", 
        maxWidth: "900px", 
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h1 style={{ 
          fontSize: "3.75rem", 
          fontWeight: 800, 
          lineHeight: "1.15", 
          letterSpacing: "-0.03em", 
          color: "#0F172A",
          marginBottom: "1.5rem" 
        }}>
          Secure, Live-Monitored <br />
          <span style={{ 
            background: "linear-gradient(135deg, #4A5FF7 0%, #6C4FD6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Academic Assessments
          </span>
        </h1>

        <p style={{ 
          fontSize: "1.15rem", 
          color: "#475569", 
          maxWidth: "720px", 
          margin: "0 auto 3rem auto",
          lineHeight: "1.7",
          fontWeight: 400
        }}>
          ExamShield protects academic integrity through state-of-the-art WebGL virtualization checks, display extensions monitoring, active browser lock detection, and real-time supervisor controls.
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem" }}>
          <Link 
            to="/student/login" 
            className="btn btn-primary" 
            style={{ 
              padding: "0.85rem 2.25rem", 
              fontSize: "0.95rem", 
              fontWeight: 600,
              borderRadius: "8px", 
              backgroundColor: "#4A5FF7",
              boxShadow: "0 4px 12px rgba(74, 95, 247, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            Take an Exam
            <ArrowRight size={16} />
          </Link>
          <Link 
            to="/proctor/login" 
            className="btn btn-secondary" 
            style={{ 
              padding: "0.85rem 2.25rem", 
              fontSize: "0.95rem", 
              fontWeight: 600,
              borderRadius: "8px", 
              border: "1px solid #CBD5E1",
              color: "#334155",
              backgroundColor: "#FFFFFF"
            }}
          >
            Sign in as Proctor
          </Link>
        </div>
      </section>

      {/* Modern Features Grid */}
      <section style={{ 
        backgroundColor: "#FFFFFF", 
        borderTop: "1px solid #E2E8F0", 
        borderBottom: "1px solid #E2E8F0", 
        padding: "5rem 2rem" 
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0F172A" }}>How ExamShield Secures Assessments</h2>
            <p style={{ color: "#64748B", fontSize: "0.95rem", marginTop: "0.5rem" }}>End-to-end integrity checks powered by real-time sync technology</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "3rem" }}>
            <div style={{ textAlign: "left", padding: "1.5rem", borderRadius: "12px", border: "1px solid #F1F5F9" }}>
              <div style={{ 
                width: "42px", 
                height: "42px", 
                borderRadius: "8px", 
                backgroundColor: "rgba(108, 79, 214, 0.08)", 
                color: "#6C4FD6", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "1.25rem",
                marginBottom: "1.25rem"
              }}>
                <Settings size={20} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.6rem" }}>1. Design & Assign</h3>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.6" }}>
                Administrators create dynamic exam pools, customize randomized question batches, and assign proctor control bounds.
              </p>
            </div>

            <div style={{ textAlign: "left", padding: "1.5rem", borderRadius: "12px", border: "1px solid #F1F5F9" }}>
              <div style={{ 
                width: "42px", 
                height: "42px", 
                borderRadius: "8px", 
                backgroundColor: "rgba(74, 95, 247, 0.08)", 
                color: "#4A5FF7", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "1.25rem",
                marginBottom: "1.25rem"
              }}>
                <Lock size={20} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.6rem" }}>2. Locked Execution</h3>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.6" }}>
                Students take exams in an environments that enforces screen-sharing, webcam feeds, browser tab locks, and virtualization checks.
              </p>
            </div>

            <div style={{ textAlign: "left", padding: "1.5rem", borderRadius: "12px", border: "1px solid #F1F5F9" }}>
              <div style={{ 
                width: "42px", 
                height: "42px", 
                borderRadius: "8px", 
                backgroundColor: "rgba(232, 163, 61, 0.08)", 
                color: "#E8A33D", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "1.25rem",
                marginBottom: "1.25rem"
              }}>
                <Monitor size={20} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.6rem" }}>3. Active Supervision</h3>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.6" }}>
                Proctors supervise candidates via real-time WebSocket violation dashboards, with options to issue direct alerts or instant suspends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section style={{ padding: "5rem 2rem 6rem 2rem", maxWidth: "1150px", margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0F172A" }}>Assessment Portals</h2>
          <p style={{ color: "#64748B", fontSize: "0.95rem", marginTop: "0.5rem" }}>Select the portal to proceed to your operational environment</p>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {/* Student Card */}
          <div style={{ 
            backgroundColor: "#FFFFFF", 
            border: "1px solid #E2E8F0", 
            borderRadius: "16px", 
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          className="role-card"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)";
          }}
          >
            <div>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                backgroundColor: "#EEF0FF", 
                color: "#4A5FF7", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "1.5rem", 
                marginBottom: "1.5rem" 
              }}>
                <BookOpen size={22} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.75rem" }}>Student Portal</h3>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "2rem" }}>
                Access your scheduled assessments, execute secure checks, complete examinations, and view your evaluation results.
              </p>
            </div>
            <Link to="/student/login" style={{ color: "#4A5FF7", fontWeight: 600, fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}>
              Launch student portal
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Proctor Card */}
          <div style={{ 
            backgroundColor: "#FFFFFF", 
            border: "1px solid #E2E8F0", 
            borderRadius: "16px", 
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          className="role-card"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)";
          }}
          >
            <div>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                backgroundColor: "#FBF2E2", 
                color: "#E8A33D", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "1.5rem", 
                marginBottom: "1.5rem" 
              }}>
                <Eye size={22} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.75rem" }}>Proctor Dashboard</h3>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "2rem" }}>
                Supervise active exam rooms, review live violation streams, verify screen shares, and manage candidate access.
              </p>
            </div>
            <Link to="/proctor/login" style={{ color: "#E8A33D", fontWeight: 600, fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}>
              Launch supervisor console
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Admin Card */}
          <div style={{ 
            backgroundColor: "#FFFFFF", 
            border: "1px solid #E2E8F0", 
            borderRadius: "16px", 
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          className="role-card"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)";
          }}
          >
            <div>
              <div style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "12px", 
                backgroundColor: "#F1EDFB", 
                color: "#6C4FD6", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "1.5rem", 
                marginBottom: "1.5rem" 
              }}>
                <Settings size={22} />
              </div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.75rem" }}>Admin Console</h3>
              <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "2rem" }}>
                Configure questions, set randomized pool parameters, assign staff roles, and audit overall completion statistics.
              </p>
            </div>
            <Link to="/admin/login" style={{ color: "#6C4FD6", fontWeight: 600, fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}>
              Launch operations center
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section style={{ 
        backgroundColor: "#0F172A", 
        color: "#ffffff",
        padding: "4.5rem 2rem",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}>Zero-Trust Integrity Architecture</h2>
          <p style={{ color: "#94A3B8", fontSize: "0.95rem", marginBottom: "2.5rem" }}>Active security guards that protect both the institution and the student.</p>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "2.5rem" }}>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#4A5FF7" }}>100%</div>
              <div style={{ fontSize: "0.85rem", color: "#94A3B8", marginTop: "0.25rem", fontWeight: 500 }}>Fullscreen Enforcement</div>
            </div>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#E8A33D" }}>&lt; 500ms</div>
              <div style={{ fontSize: "0.85rem", color: "#94A3B8", marginTop: "0.25rem", fontWeight: 500 }}>WebSocket Live Sync</div>
            </div>
            <div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#6C4FD6" }}>Auto</div>
              <div style={{ fontSize: "0.85rem", color: "#94A3B8", marginTop: "0.25rem", fontWeight: 500 }}>Infraction Console Locks</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        marginTop: "auto", 
        borderTop: "1px solid #E2E8F0", 
        padding: "1.5rem 3rem", 
        backgroundColor: "#FFFFFF",
        fontSize: "0.85rem",
        color: "#64748B"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1150px", margin: "0 auto" }}>
          <div>&copy; {new Date().getFullYear()} ExamShield. All rights reserved.</div>
          <div style={{ display: "flex", gap: "1.5rem", fontWeight: 500 }}>
            <Link to="/student/login" style={{ color: "#64748B", textDecoration: "none" }}>Student Portal</Link>
            <span>•</span>
            <Link to="/proctor/login" style={{ color: "#64748B", textDecoration: "none" }}>Proctor Portal</Link>
            <span>•</span>
            <Link to="/admin/login" style={{ color: "#64748B", textDecoration: "none" }}>Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
