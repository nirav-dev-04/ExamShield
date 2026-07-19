import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Shield, Lock, Mail, Key, Eye, EyeOff, LogIn, CheckCircle, X } from "lucide-react";
import { apiClient } from "../../config/axios";

export function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password Reset Modal States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEnrollmentNo, setResetEnrollmentNo] = useState("");
  const [resetStaffCode, setResetStaffCode] = useState("");
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const isMockActive = import.meta.env.VITE_USE_MOCK === "true";
  const path = location.pathname;

  const isStudent = path.startsWith("/student");
  const isProctor = path.startsWith("/proctor");
  const isAdmin = path.startsWith("/admin");

  useEffect(() => {
    if (user) {
      if (user.role === "STUDENT" && isStudent) {
        navigate("/student/dashboard", { replace: true });
      } else if (user.role === "PROCTOR" && isProctor) {
        navigate("/proctor/dashboard", { replace: true });
      } else if ((user.role === "ADMIN" || user.role === "SUPER_ADMIN") && isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [user, isStudent, isProctor, isAdmin, navigate]);

  const getRoleTheme = () => {
    if (isProctor) {
      return {
        accent: "#E8A33D",
        accentHover: "#C6862A",
        bgTint: "#FBF2E2",
        title: "Proctor Sign In",
        subtext: "Secure Proctoring Portal",
        labelEmail: "Institutional Email"
      };
    }
    if (isAdmin) {
      return {
        accent: "#6C4FD6",
        accentHover: "#5A3FB8",
        bgTint: "#F1EDFB",
        title: "Admin Sign In",
        subtext: "Secure Administration Portal",
        labelEmail: "Administrator ID or Email"
      };
    }
    // Student
    return {
      accent: "#4A5FF7",
      accentHover: "#3B4CD1",
      bgTint: "#EEF0FF",
      title: "Student Sign In",
      subtext: "Secure Proctoring Environment",
      labelEmail: "Email Address"
    };
  };

  const theme = getRoleTheme();

  const handleRoleSelect = (role: "student" | "proctor" | "admin") => {
    if (role === "student") {
      setEmail("student@examshield.com");
      setPassword("ldrp@123");
    } else if (role === "proctor") {
      setEmail("proctor@examshield.com");
      setPassword("ldrp@123");
    } else {
      setEmail("admin@examshield.com");
      setPassword("ldrp@123");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, rememberMe);
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

  const handleOpenResetModal = () => {
    setResetEmail("");
    setResetEnrollmentNo("");
    setResetStaffCode("");
    setNewResetPassword("");
    setConfirmResetPassword("");
    setResetError(null);
    setResetSuccess(null);
    setShowResetModal(true);
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (newResetPassword !== confirmResetPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        email: resetEmail,
        enrollmentNo: isStudent ? resetEnrollmentNo : undefined,
        staffVerificationCode: !isStudent ? resetStaffCode : undefined,
        newPassword: newResetPassword
      });
      setResetSuccess("Password reset successfully! You can now sign in with your new password.");
    } catch (err: any) {
      setResetError(err.response?.data?.message || "Failed to reset password. Please check your credentials.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[#F7F8FA]">
      {/* Left Panel: Role-Specific Decorative Tint */}
      <div 
        className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: theme.bgTint }}
      >
        {/* Abstract Background Design */}
        <div className="absolute inset-0 opacity-10 flex flex-wrap justify-center items-center gap-24 pointer-events-none p-12">
          <Shield size={120} strokeWidth={1} style={{ color: theme.accent }} />
          <Lock size={100} strokeWidth={1} style={{ color: theme.accent }} />
          <Shield size={110} strokeWidth={1} style={{ color: theme.accent }} />
        </div>

        {/* Brand Header */}
        <Link to="/" className="z-10 flex items-center gap-2" style={{ textDecoration: "none" }}>
          <Shield size={32} className="fill-current" style={{ color: theme.accent }} />
          <span className="text-xl font-bold tracking-tight text-[#0F1B2E]">ExamShield</span>
        </Link>

        {/* Center Welcome Statement */}
        <div className="z-10 max-w-md my-auto">
          <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm inline-flex items-center justify-center border border-outline-variant">
            <Lock size={40} style={{ color: theme.accent }} />
          </div>
          <h1 className="text-3xl font-bold text-[#0F1B2E] mb-2">ExamShield</h1>
          <p className="text-lg font-medium" style={{ color: theme.accent }}>
            {theme.subtext}
          </p>
          <p className="text-sm text-[#5B6472] mt-2">
            Providing reliable and high-integrity session verification for examinations.
          </p>
        </div>

        {/* Trust Indicators at Bottom (For proctors and admins, shown for consistency) */}
        <div className="z-10 grid grid-cols-3 gap-4 border-t border-[#E2E5EA]/20 pt-8">
          <div className="flex items-center gap-2 text-xs text-[#5B6472]">
            <CheckCircle size={16} style={{ color: theme.accent }} />
            <span>Encrypted Session</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5B6472]">
            <CheckCircle size={16} style={{ color: theme.accent }} />
            <span>Verified Identity</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5B6472]">
            <CheckCircle size={16} style={{ color: theme.accent }} />
            <span>Access Guard</span>
          </div>
        </div>
      </div>

      {/* Right Panel: White Login Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-[400px] flex flex-col">
          {/* Mobile Header (Hidden on Desktop) */}
          <Link to="/" className="md:hidden flex flex-col items-center mb-8" style={{ textDecoration: "none" }}>
            <Shield size={48} className="mb-2 fill-current" style={{ color: theme.accent }} />
            <h1 className="text-2xl font-bold text-[#0F1B2E]">ExamShield</h1>
            <p className="text-sm font-medium" style={{ color: theme.accent }}>{theme.subtext}</p>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F1B2E]">{theme.title}</h2>
            <p className="text-sm text-[#5B6472] mt-1">Enter your credentials to access your secure dashboard.</p>
          </div>

          {isMockActive && (
            <div className="mb-6 p-4 bg-[#F7F8FA] rounded-lg border border-[#E2E5EA]">
              <div className="text-xs font-semibold text-[#5B6472] mb-3 text-center uppercase tracking-wider">
                Demo Role Auto-Fill (Mock Mode)
              </div>
              <div className="flex gap-2">
                {isStudent && (
                  <button 
                    type="button" 
                    onClick={() => handleRoleSelect("student")} 
                    className="flex-1 py-1.5 px-3 bg-white border border-[#E2E5EA] rounded text-xs font-semibold text-[#0F1B2E] hover:bg-gray-50 transition-colors"
                  >
                    Student Demo
                  </button>
                )}
                {isProctor && (
                  <button 
                    type="button" 
                    onClick={() => handleRoleSelect("proctor")} 
                    className="flex-1 py-1.5 px-3 bg-white border border-[#E2E5EA] rounded text-xs font-semibold text-[#0F1B2E] hover:bg-gray-50 transition-colors"
                  >
                    Proctor Demo
                  </button>
                )}
                {isAdmin && (
                  <button 
                    type="button" 
                    onClick={() => handleRoleSelect("admin")} 
                    className="flex-1 py-1.5 px-3 bg-white border border-[#E2E5EA] rounded text-xs font-semibold text-[#0F1B2E] hover:bg-gray-50 transition-colors"
                  >
                    Admin Demo
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-[#D64545] border border-red-100 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#0F1B2E]">{theme.labelEmail}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6472]">
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isStudent ? "student@university.edu" : "name@university.edu"}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 transition-all placeholder:text-[#5B6472]"
                  style={{ 
                    '--tw-ring-color': theme.bgTint,
                    borderColor: email ? theme.accent : '#E2E5EA'
                  } as any}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-[#0F1B2E]">Password</label>
                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="text-xs font-semibold hover:underline bg-transparent border-0 cursor-pointer p-0"
                  style={{ color: theme.accent }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6472]">
                  <Key size={18} />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 transition-all placeholder:text-[#5B6472]"
                  style={{ 
                    '--tw-ring-color': theme.bgTint,
                    borderColor: password ? theme.accent : '#E2E5EA'
                  } as any}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6472] hover:text-[#0F1B2E]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#E2E5EA] focus:ring-2 cursor-pointer"
                style={{ 
                  color: theme.accent, 
                  '--tw-ring-color': theme.bgTint
                } as any}
              />
              <label htmlFor="remember" className="text-xs text-[#5B6472] cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 w-full text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm"
              style={{ 
                backgroundColor: theme.accent,
                '--tw-ring-color': theme.bgTint
              } as any}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.accentHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.accent}
            >
              {loading ? "Signing In..." : "Sign In"}
              <LogIn size={18} />
            </button>
          </form>

          {isStudent ? (
            <div className="mt-6 text-center text-sm text-[#5B6472]">
              New candidate?{" "}
              <Link 
                to="/student/register" 
                className="font-semibold hover:underline" 
                style={{ color: theme.accent }}
              >
                Register
              </Link>
            </div>
          ) : (
            <p className="mt-6 text-xs text-[#5B6472] text-center italic">
              Staff and administrator accounts are created by an existing Administrator.
            </p>
          )}

          {/* Secure Note */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-[#5B6472] opacity-60">
            <Lock size={14} />
            <span className="text-xs">Secure Connection</span>
          </div>
        </div>
      </div>

      {/* Premium Forgot Password Glassmorphism Overlay */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1B2E]/60 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-[450px] bg-white rounded-2xl border border-[#E2E5EA] shadow-2xl p-6 relative flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-[#0F1B2E]">Recover Password</h3>
                <p className="text-xs text-[#5B6472] mt-0.5">
                  Confirm your details to reset your credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1.5 hover:bg-[#F7F8FA] rounded-full text-[#5B6472] hover:text-[#0F1B2E] transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 text-[#D64545] border border-red-100 rounded-lg text-xs font-medium">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-green-50 text-[#178550] border border-green-100 rounded-lg text-xs font-medium">
                {resetSuccess}
              </div>
            )}

            {/* Form */}
            {!resetSuccess ? (
              <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0F1B2E]">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full px-3 py-2 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 focus:ring-[#EEF0FF] transition-all"
                    required
                  />
                </div>

                {/* Role Specific Verification field */}
                {isStudent ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#0F1B2E]">Student Enrollment Number</label>
                    <input
                      type="text"
                      value={resetEnrollmentNo}
                      onChange={(e) => setResetEnrollmentNo(e.target.value)}
                      placeholder="e.g. EN98982"
                      className="w-full px-3 py-2 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 focus:ring-[#EEF0FF] transition-all"
                      required
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-[#0F1B2E]">Staff Verification Override PIN</label>
                      <span className="text-[10px] text-[#5B6472] font-semibold uppercase tracking-wider">Demo Code: ldrp</span>
                    </div>
                    <input
                      type="password"
                      value={resetStaffCode}
                      onChange={(e) => setResetStaffCode(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3 py-2 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 focus:ring-[#EEF0FF] transition-all"
                      required
                    />
                  </div>
                )}

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0F1B2E]">New Password</label>
                  <input
                    type="password"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 focus:ring-[#EEF0FF] transition-all"
                    required
                  />
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0F1B2E]">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 focus:ring-[#EEF0FF] transition-all"
                    required
                  />
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="mt-2 w-full text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm border-0 cursor-pointer"
                  style={{ backgroundColor: theme.accent }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.accentHover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.accent}
                >
                  {resetLoading ? "Processing..." : "Reset Password"}
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="mt-2 w-full text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm border-0 cursor-pointer"
                style={{ backgroundColor: theme.accent }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.accent}
              >
                Close and Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
