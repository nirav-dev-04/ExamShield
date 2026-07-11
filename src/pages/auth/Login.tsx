import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";

interface LoginProps {
  onToggleAuth: () => void;
}

export function Login({ onToggleAuth }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isMockActive = import.meta.env.VITE_USE_MOCK === "true";

  const handleRoleSelect = (role: "student" | "proctor" | "admin") => {
    if (role === "student") {
      setEmail("john@student.com");
      setPassword("Password123!");
    } else if (role === "proctor") {
      setEmail("jane@proctor.com");
      setPassword("Password123!");
    } else {
      setEmail("admin@admin.com");
      setPassword("Password123!");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      if (err.response && err.response.status === 429) {
        setError("Too many login attempts. Please try again after a minute.");
      } else {
        setError(err.response?.data?.message || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "6rem auto", padding: "2rem", border: "1px solid var(--border-subtle)", borderRadius: "4px" }}>
      <h1 className="flat-title" style={{ textAlign: "center", marginBottom: "1.5rem" }}>Login to ExamShield</h1>
      
      {isMockActive && (
        <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--fg-secondary)", marginBottom: "0.75rem", textAlign: "center" }}>
            Demo Role Auto-Fill (Mock Mode)
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              type="button" 
              onClick={() => handleRoleSelect("student")} 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: "0.5rem", fontSize: "0.8rem", fontWeight: 600 }}
            >
              Student
            </button>
            <button 
              type="button" 
              onClick={() => handleRoleSelect("proctor")} 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: "0.5rem", fontSize: "0.8rem", fontWeight: 600 }}
            >
              Proctor
            </button>
            <button 
              type="button" 
              onClick={() => handleRoleSelect("admin")} 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: "0.5rem", fontSize: "0.8rem", fontWeight: 600 }}
            >
              Admin
            </button>
          </div>
        </div>
      )}
      {error && (
        <div style={{ color: "var(--state-danger)", backgroundColor: "#fff1f2", padding: "0.75rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9rem" }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
          {loading ? "Authenticating..." : "Login"}
        </button>
      </form>
      <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem" }}>
        New candidate?{" "}
        <button onClick={onToggleAuth} style={{ background: "none", border: "none", color: "var(--accent-primary)", fontWeight: 600 }}>
          Create an account
        </button>
      </div>
    </div>
  );
}
