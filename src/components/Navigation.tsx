import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return null;

  // Hide navigation during active exam
  if (location.pathname.startsWith("/student/exam/")) return null;

  const getLogoRedirectPath = () => {
    if (!user) return "/";
    if (user.role === "STUDENT") return "/student/dashboard";
    if (user.role === "PROCTOR") return "/proctor/dashboard";
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return "/admin/dashboard";
    return "/";
  };

  return (
    <nav style={{ 
      backgroundColor: "var(--bg-secondary)", 
      borderBottom: "1px solid var(--border-subtle)", 
      padding: "1rem 2rem", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center" 
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
        <Link to={getLogoRedirectPath()} style={{ textDecoration: "none", fontWeight: 700, fontSize: "1.25rem", color: "var(--accent-primary)" }}>
          ExamShield
        </Link>
        
        {/* Navigation Links */}
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {(user.role === "STUDENT") && (
            <>
              <NavLink 
                to="/student/dashboard" 
                style={({ isActive }) => ({
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: isActive ? "var(--accent-primary)" : "var(--fg-secondary)",
                })}
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/student/results" 
                style={({ isActive }) => ({
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: isActive ? "var(--accent-primary)" : "var(--fg-secondary)",
                })}
              >
                Results
              </NavLink>
            </>
          )}

          {user.role === "PROCTOR" && (
            <NavLink 
              to="/proctor/dashboard" 
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: isActive ? "var(--accent-primary)" : "var(--fg-secondary)",
              })}
            >
              Proctor Console
            </NavLink>
          )}


        </div>
      </div>
      
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.9rem", color: "var(--fg-secondary)" }}>
          {user.fullName} ({user.role})
        </span>
        <button 
          onClick={() => logout()} 
          className="btn btn-secondary" 
          style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
