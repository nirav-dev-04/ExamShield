import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Shield, Lock, User, Mail, Key, Hash, CheckCircle, Eye, EyeOff } from "lucide-react";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const path = location.pathname;
  const isProctor = path.startsWith("/proctor");
  const isAdmin = path.startsWith("/admin");

  const getRoleTheme = () => {
    if (isProctor) {
      return {
        accent: "#E8A33D",
        accentHover: "#C6862A",
        bgTint: "#FBF2E2",
        role: "PROCTOR",
        title: "Create Proctor Account",
        subtext: "Secure Proctoring Portal",
        desc: "Create an proctor credentials account to monitor live examinations.",
        loginLink: "/proctor/login"
      };
    }
    if (isAdmin) {
      return {
        accent: "#6C4FD6",
        accentHover: "#5A3FB8",
        bgTint: "#F1EDFB",
        role: "ADMIN",
        title: "Create Admin Account",
        subtext: "Secure Administration Portal",
        desc: "Create an administrative account to audit sessions and manage schedules.",
        loginLink: "/admin/login"
      };
    }
    // Student
    return {
      accent: "#4A5FF7",
      accentHover: "#3B4CD1",
      bgTint: "#EEF0FF",
      role: "STUDENT",
      title: "Create Student Account",
      subtext: "Secure Proctoring Environment",
      desc: "Create an account to securely access examinations and check graded results.",
      loginLink: "/student/login"
    };
  };

  const theme = getRoleTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Pass dynamic role to API registry (STUDENT, PROCTOR, or ADMIN)
      await register(fullName, email, password, theme.role as any, theme.role === "STUDENT" ? enrollmentNo : "");
      setSuccess(true);
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-[#F7F8FA]">
      {/* Left Panel: Role-Specific Background */}
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
          <h1 className="text-3xl font-bold text-[#0F1B2E] mb-2">Join ExamShield</h1>
          <p className="text-lg font-medium" style={{ color: theme.accent }}>
            {theme.subtext}
          </p>
          <p className="text-sm text-[#5B6472] mt-2">
            {theme.desc}
          </p>
        </div>

        {/* Trust Indicators at Bottom */}
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

      {/* Right Panel: White Registration Form */}
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
            <p className="text-sm text-[#5B6472] mt-1">Enter details below to establish your profile.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-[#D64545] border border-red-100 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-[#EEF0FF] text-[#4A5FF7] border border-indigo-100 rounded-lg text-sm flex items-center gap-2" style={{ color: theme.accent, backgroundColor: theme.bgTint, borderColor: theme.accent + '22' }}>
              <CheckCircle size={18} />
              <span>Registration successful. Redirecting to sign in...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" autoComplete="off">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#0F1B2E]">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6472]">
                  <User size={18} />
                </span>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 transition-all placeholder:text-[#5B6472]"
                  style={{ 
                    '--tw-ring-color': theme.bgTint,
                    borderColor: fullName ? theme.accent : '#E2E5EA'
                  } as any}
                  required
                  disabled={loading || success}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#0F1B2E]">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6472]">
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@examshield.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 transition-all placeholder:text-[#5B6472]"
                  style={{ 
                    '--tw-ring-color': theme.bgTint,
                    borderColor: email ? theme.accent : '#E2E5EA'
                  } as any}
                  required
                  disabled={loading || success}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#0F1B2E]">Password</label>
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
                  disabled={loading || success}
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
              <span className="text-xs text-[#5B6472] mt-0.5">Must be at least 8 characters long</span>
            </div>

            {/* Student ID (enrollmentNo) - Only render if STUDENT role */}
            {theme.role === "STUDENT" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#0F1B2E]">Student ID / Enrollment Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6472]">
                    <Hash size={18} />
                  </span>
                  <input 
                    type="text" 
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                    placeholder="STU123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E5EA] rounded-lg text-sm text-[#0F1B2E] focus:outline-none focus:ring-2 transition-all placeholder:text-[#5B6472]"
                    style={{ 
                      '--tw-ring-color': theme.bgTint,
                      borderColor: enrollmentNo ? theme.accent : '#E2E5EA'
                    } as any}
                    required
                    disabled={loading || success}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || success}
              className="mt-2 w-full text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm"
              style={{ 
                backgroundColor: theme.accent,
                '--tw-ring-color': theme.bgTint
              } as any}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.accentHover}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.accent}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#5B6472]">
            Already have an account?{" "}
            <Link to={theme.loginLink} className="font-semibold hover:underline" style={{ color: theme.accent }}>
              Sign In
            </Link>
          </div>

          {/* Secure Note */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-[#5B6472] opacity-60">
            <Lock size={14} />
            <span className="text-xs">Secure Connection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
