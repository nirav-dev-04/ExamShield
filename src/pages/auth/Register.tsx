import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";

interface RegisterProps {
  onToggleAuth: () => void;
}

export function Register({ onToggleAuth }: RegisterProps) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(fullName, email, password, role, enrollmentNo);
      setSuccess(true);
      setTimeout(() => {
        onToggleAuth();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "4rem auto", padding: "2rem", border: "1px solid var(--border-subtle)", borderRadius: "4px" }}>
      <h1 className="flat-title" style={{ textAlign: "center", marginBottom: "1.5rem" }}>Register Account</h1>
      {error && (
        <div style={{ color: "var(--state-danger)", backgroundColor: "#fff1f2", padding: "0.75rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: "var(--accent-primary)", backgroundColor: "var(--accent-light)", padding: "0.75rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9rem" }}>
          Registration successful. Redirecting to login...
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading || success}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || success}
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
            disabled={loading || success}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Account Role</label>
          <select
            className="form-input"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={loading || success}
            style={{ backgroundColor: "var(--bg-primary)" }}
          >
            <option value="STUDENT">STUDENT</option>
            <option value="PROCTOR">PROCTOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Enrollment Number</label>
          <input
            type="text"
            className="form-input"
            value={enrollmentNo}
            onChange={(e) => setEnrollmentNo(e.target.value)}
            required
            disabled={loading || success}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading || success}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem" }}>
        Already registered?{" "}
        <button onClick={onToggleAuth} style={{ background: "none", border: "none", color: "var(--accent-primary)", fontWeight: 600 }} disabled={success}>
          Log in here
        </button>
      </div>
    </div>
  );
}
