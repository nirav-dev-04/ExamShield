import { useState, useEffect } from "react";
import { apiClient } from "../../config/axios";
import { 
  UserPlus, 
  Search, 
  Edit, 
  Check, 
  X, 
  Shield, 
  User, 
  Key, 
  Mail, 
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface User {
  id: number;
  fullName: string;
  email: string;
  role: "STUDENT" | "PROCTOR" | "ADMIN";
  enrollmentNo?: string;
  isActive: boolean;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Pagination
  const [activeTab, setActiveTab] = useState<"ALL" | "STUDENT" | "PROCTOR" | "ADMIN">("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalRole, setModalRole] = useState<User["role"]>("PROCTOR");
  
  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Edit User State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const fetchUsers = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const roleParam = activeTab === "ALL" ? "" : activeTab;
      const response = await apiClient.get<PageResponse<User>>("/admin/users", {
        params: {
          role: roleParam || undefined,
          page,
          size: 10,
        },
        signal,
      });
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      if (err.name === "CanceledError" || err.name === "AbortError") {
        return; // Silent ignore for aborted stale requests
      }
      setError("Failed to load user registry.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => {
      controller.abort();
    };
  }, [activeTab, page]);

  const handleStatusToggle = async (userId: number, currentActive: boolean) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, null, {
        params: { active: !currentActive },
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
      );
    } catch (err) {
      console.error("Failed to update user status", err);
      alert("Failed to toggle user status.");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      await apiClient.post("/admin/users", {
        fullName,
        email,
        password,
        role: modalRole,
        enrollmentNo: modalRole === "STUDENT" ? enrollmentNo : undefined,
      });
      
      // Reset Form
      setFullName("");
      setEmail("");
      setPassword("");
      setEnrollmentNo("");
      setShowAddModal(false);
      
      // Refresh registry
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to create user account.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setFormError(null);
    setFormLoading(true);
    try {
      await apiClient.put(`/admin/users/${editingUserId}`, {
        fullName,
        email,
        password: password || undefined, // send only if not blank
        role: modalRole,
        enrollmentNo: modalRole === "STUDENT" ? enrollmentNo : undefined,
      });

      // Reset
      setFullName("");
      setEmail("");
      setPassword("");
      setEnrollmentNo("");
      setShowEditModal(false);
      setEditingUserId(null);

      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to update user account.");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword("");
    setModalRole(user.role as any);
    setEnrollmentNo(user.enrollmentNo || "");
    setShowEditModal(true);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleColors = (role: User["role"]) => {
    if (role === "STUDENT") {
      return { bg: "#EEF0FF", text: "#4A5FF7", border: "rgba(74, 95, 247, 0.15)" };
    }
    if (role === "PROCTOR") {
      return { bg: "#FBF2E2", text: "#E8A33D", border: "rgba(232, 163, 61, 0.15)" };
    }
    return { bg: "#F1EDFB", text: "#6C4FD6", border: "rgba(108, 79, 214, 0.15)" };
  };

  const openAddModal = (role: User["role"]) => {
    setFullName("");
    setEmail("");
    setPassword("");
    setEnrollmentNo("");
    setFormError(null);
    setModalRole(role);
    setShowAddModal(true);
  };

  return (
    <div className="layout-container" style={{ padding: "2rem 3rem", height: "100%", overflowY: "auto", scrollBehavior: "smooth" }}>
      <header className="flat-header" style={{ 
        marginBottom: "2.5rem", 
        width: "100%", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "stretch" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <h1 className="flat-title" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>User Directory</h1>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => openAddModal("PROCTOR")}
              style={{ 
                padding: "0.7rem 1.5rem", 
                fontSize: "0.875rem", 
                fontWeight: 600, 
                color: "#FFFFFF",
                backgroundColor: "#E8A33D",
                border: "none",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(232, 163, 61, 0.2)",
                transition: "transform 0.15s, opacity 0.15s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <UserPlus size={16} />
              <span>Add Proctor</span>
            </button>
            <button
              onClick={() => openAddModal("ADMIN")}
              style={{ 
                padding: "0.7rem 1.5rem", 
                fontSize: "0.875rem", 
                fontWeight: 600, 
                border: "1px solid #CBD5E1",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                transition: "transform 0.15s, background-color 0.15s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; }}
            >
              <ShieldCheck size={16} />
              <span>Add Admin</span>
            </button>
          </div>
        </div>
        <p className="flat-subtitle" style={{ fontSize: "0.9rem", color: "#64748B", marginTop: "0.5rem", margin: 0 }}>
          Manage directories, verify enrollment credentials, toggle authorization status, and enroll new staff.
        </p>
      </header>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "8px", color: "var(--state-danger)", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid #E2E8F0", marginBottom: "2rem" }}>
        {(["ALL", "STUDENT", "PROCTOR", "ADMIN"] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(0);
              }}
              style={{
                background: "none",
                border: "none",
                padding: "0.75rem 0.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                color: isActive ? "#4A5FF7" : "#64748B",
                borderBottom: isActive ? "3px solid #4A5FF7" : "3px solid transparent",
                marginBottom: "-1.5px",
                transition: "all 0.2s"
              }}
            >
              {tab === "ALL" ? "All Accounts" : tab + "s"}
            </button>
          );
        })}
      </div>

      {/* Registry Table List */}
      {loading ? (
        <div style={{ color: "#64748B", fontSize: "0.9rem", padding: "3rem 0", display: "flex", alignItems: "center", justifySelf: "center", gap: "0.5rem" }}>
          <span>Loading accounts registry...</span>
        </div>
      ) : (
        <>
          <div style={{ 
            backgroundColor: "#FFFFFF", 
            border: "1px solid #E2E8F0", 
            borderRadius: "16px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            overflow: "hidden"
          }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", 
              padding: "1rem 1.5rem", 
              fontWeight: 700, 
              fontSize: "0.75rem", 
              color: "#475569", 
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderBottom: "1px solid #E2E8F0", 
              backgroundColor: "#F8FAFC" 
            }}>
              <span>User / Email</span>
              <span>Account Role</span>
              <span>Enrollment No</span>
              <span>Account Status</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>
            
            {users.length === 0 && (
              <div style={{ color: "#64748B", padding: "3rem 1.5rem", textAlign: "center", fontSize: "0.9rem" }}>
                No accounts match the selected filter criteria.
              </div>
            )}

            {users.map((u) => {
              const colors = getRoleColors(u.role);
              return (
                <div 
                  key={u.id} 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", 
                    padding: "1rem 1.5rem", 
                    alignItems: "center",
                    borderBottom: "1px solid #F1F5F9",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F8FAFC"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  {/* User Profile Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: colors.bg,
                      color: colors.text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      border: `1px solid ${colors.border}`
                    }}>
                      {getInitials(u.fullName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.9rem" }}>{u.fullName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "1px" }}>{u.email}</div>
                    </div>
                  </div>

                  {/* Role Tag */}
                  <div>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      textTransform: "uppercase"
                    }}>
                      {u.role}
                    </span>
                  </div>

                  {/* Enrollment */}
                  <div>
                    <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>{u.enrollmentNo || "N/A"}</span>
                  </div>

                  {/* Status Toggle Switch */}
                  <div>
                    <button
                      onClick={() => handleStatusToggle(u.id, u.isActive)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: 0
                      }}
                    >
                      {u.isActive ? (
                        <ToggleRight size={28} className="text-[#1E9E6B]" />
                      ) : (
                        <ToggleLeft size={28} className="text-[#64748B]" />
                      )}
                      <span style={{ 
                        fontSize: "0.8rem", 
                        color: u.isActive ? "#1E9E6B" : "#64748B", 
                        fontWeight: 700 
                      }}>
                        {u.isActive ? "Authorized" : "Disabled"}
                      </span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={() => openEditModal(u)}
                      style={{ 
                        padding: "0.4rem 0.8rem", 
                        fontSize: "0.75rem", 
                        fontWeight: 600,
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: "6px",
                        color: "#334155",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F8FAFC"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn btn-secondary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              
              <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}>
                Page {page + 1} of {totalPages}
              </span>
              
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="btn btn-secondary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", borderRadius: "8px", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", gap: "0.25rem" }}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal - Add User */}
      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF", 
            border: "1px solid #E2E8F0",
            borderRadius: "16px", 
            padding: "2rem", 
            width: "420px", 
            maxWidth: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A", marginBottom: "1.25rem" }}>
              Add {modalRole === "PROCTOR" ? "Proctor" : "Administrator"} Account
            </h2>
            
            {formError && (
              <div style={{ color: "var(--state-danger)", backgroundColor: "#FEF2F2", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.8rem", border: "1px solid #FEE2E2" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  required
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.6rem 0.8rem" }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  required
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.6rem 0.8rem" }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Security Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.6rem 0.8rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormError(null);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", fontWeight: 600, border: "1px solid #CBD5E1" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", fontWeight: 600, backgroundColor: "#6C4FD6", border: "none" }}
                  disabled={formLoading}
                >
                  {formLoading ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edit User */}
      {showEditModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF", 
            border: "1px solid #E2E8F0",
            borderRadius: "16px", 
            padding: "2rem", 
            width: "420px", 
            maxWidth: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0F172A", marginBottom: "1.25rem" }}>
              Edit Account Settings
            </h2>
            
            {formError && (
              <div style={{ color: "var(--state-danger)", backgroundColor: "#FEF2F2", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.8rem", border: "1px solid #FEE2E2" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.6rem 0.8rem" }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.6rem 0.8rem" }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Password (Leave blank to keep current)</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.6rem 0.8rem" }}
                />
              </div>

              {modalRole === "STUDENT" && (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: "#334155", marginBottom: "0.4rem", display: "block" }}>Enrollment Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                    required
                    style={{ borderRadius: "8px", border: "1px solid #CBD5E1", padding: "0.6rem 0.8rem" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setFormError(null);
                    setEditingUserId(null);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", fontWeight: 600, border: "1px solid #CBD5E1" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", fontWeight: 600, backgroundColor: "#6C4FD6", border: "none" }}
                  disabled={formLoading}
                >
                  {formLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
