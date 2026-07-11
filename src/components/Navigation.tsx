import { useAuth } from "../context/AuthContext";

export function Navigation() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav style={{ 
      backgroundColor: "var(--bg-secondary)", 
      borderBottom: "1px solid var(--border-subtle)", 
      padding: "1rem 2rem", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center" 
    }}>
      <div style={{ fontWeight: 700, fontSize: "1.25rem", color: "var(--accent-primary)" }}>
        ExamShield
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
