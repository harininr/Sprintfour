import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Shield, CheckCircle, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const TRUST_BADGES = [
  { icon: Shield, label: "SOC 2 Compliant" },
  { icon: CheckCircle, label: "GDPR Ready" },
  { icon: CheckCircle, label: "HIPAA Aligned" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setIsLoading(true);
    setTimeout(() => {
      setLoginSuccess(true);
      setTimeout(() => {
        login({ id: "usr_mock_123", name: email.split("@")[0], email });
        toast.success("Welcome back!");
        setLocation("/dashboard");
      }, 600);
      setIsLoading(false);
    }, 1200);
  };

  const handleAutoLogin = () => {
    setIsAutoLoggingIn(true);
    setEmail("harinin006@gmail.com");
    setPassword("Harini@0504");
    setTimeout(() => {
      setLoginSuccess(true);
      setTimeout(() => {
        login({ id: "usr_mock_123", name: "Evaluator", email: "harinin006@gmail.com" });
        toast.success("Welcome, Evaluator!");
        setLocation("/dashboard");
      }, 600);
      setIsAutoLoggingIn(false);
    }, 900);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F5F0E8", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&display=swap');
        .login-field {
          width: 100%;
          height: 54px;
          background: #FDFAF5;
          border: 1.5px solid #E2D5C3;
          border-radius: 12px;
          padding: 0 16px 0 48px;
          font-size: 15px;
          color: #2A1A0E;
          outline: none;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .login-field::placeholder { color: #B8A898; }
        .login-field:focus {
          border-color: #6B1E2B;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(107,30,43,0.1);
        }
        .login-btn-primary {
          width: 100%;
          height: 54px;
          background: linear-gradient(135deg, #6B1E2B 0%, #8B2535 100%);
          color: #FDFAF5;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(107,30,43,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.01em;
        }
        .login-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #7D2334 0%, #9E2D3F 100%);
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(107,30,43,0.35);
        }
        .login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-btn-evaluator {
          width: 100%;
          height: 54px;
          background: #FFF8F0;
          border: 1.5px solid #D4A574;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          color: #6B1E2B;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn-evaluator:hover:not(:disabled) {
          background: #FDECD8;
          border-color: #B8813A;
          transform: translateY(-1px);
        }
        .login-btn-evaluator:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9B7E6A;
          margin-bottom: 8px;
        }
      `}</style>

      {/* Left — Form Panel */}
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", padding: "48px 64px", background: "#FDFAF5", boxShadow: "4px 0 40px rgba(107,30,43,0.06)" }}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", marginBottom: 56 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg, #6B1E2B, #8B2535)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(107,30,43,0.35)" }}>
              <Shield size={20} color="#FDFAF5" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#2A1A0E", fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em" }}>
              Redact Review
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          {/* ── EVALUATOR QUICK ACCESS BANNER (top, prominent) ─────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ marginBottom: 32, borderRadius: 16, background: "linear-gradient(135deg, #6B1E2B 0%, #8B2535 100%)", padding: "22px 24px", boxShadow: "0 8px 32px rgba(107,30,43,0.28)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#FDFAF5", letterSpacing: "0.04em", textTransform: "uppercase" }}>Evaluator Quick Access</p>
                <p style={{ fontSize: 12, color: "rgba(253,250,245,0.6)", marginTop: 1 }}>Click below — no typing needed</p>
              </div>
            </div>

            {/* Credentials display */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(253,250,245,0.1)", border: "1px solid rgba(253,250,245,0.18)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(253,250,245,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Email</p>
                <p style={{ fontSize: 12, color: "#FDFAF5", fontFamily: "monospace" }}>harinin006@gmail.com</p>
              </div>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(253,250,245,0.1)", border: "1px solid rgba(253,250,245,0.18)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(253,250,245,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Password</p>
                <p style={{ fontSize: 12, color: "#FDFAF5", fontFamily: "monospace" }}>Harini@0504</p>
              </div>
            </div>

            <button
              className="login-btn-evaluator-top"
              onClick={handleAutoLogin}
              disabled={isLoading || isAutoLoggingIn}
              style={{ width: "100%", height: 48, background: "#FDFAF5", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "#6B1E2B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Inter', sans-serif", transition: "all 0.2s", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F0E8"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#FDFAF5"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              {isAutoLoggingIn
                ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                : <><Zap size={17} fill="#6B1E2B" /><span>Login as Evaluator Instantly</span><ArrowRight size={16} /></>}
            </button>
          </motion.div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{ flex: 1, height: 1, background: "#E2D5C3" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#B8A898", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Or sign in manually</span>
            <div style={{ flex: 1, height: 1, background: "#E2D5C3" }} />
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: "#2A1A0E", fontFamily: "'Playfair Display', serif", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 8 }}>
              Welcome back.
            </h1>
            <p style={{ fontSize: 14, color: "#7A6355", lineHeight: 1.65 }}>
              Sign in to your workspace and continue auditing documents.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label className="login-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: focusedField === "email" ? "#6B1E2B" : "#B8A898", pointerEvents: "none", transition: "color 0.2s" }} />
                <input
                  type="email"
                  className="login-field"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="login-label" style={{ marginBottom: 0 }}>Password</label>
                <a href="#" style={{ fontSize: 12, color: "#6B1E2B", fontWeight: 600, textDecoration: "none" }}>Forgot password?</a>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: focusedField === "password" ? "#6B1E2B" : "#B8A898", pointerEvents: "none", transition: "color 0.2s" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-field"
                  style={{ paddingRight: 48 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#B8A898", padding: 0, display: "flex" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <AnimatePresence mode="wait">
                {loginSuccess ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="login-btn-primary" style={{ background: "linear-gradient(135deg, #1a5c2a, #236b33)", pointerEvents: "none" }}>
                    <CheckCircle size={18} />
                    <span>Authenticated!</span>
                  </motion.div>
                ) : (
                  <button type="submit" className="login-btn-primary" disabled={isLoading || isAutoLoggingIn}>
                    {isLoading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <><span>Sign In</span><ArrowRight size={16} /></>}
                  </button>
                )}
              </AnimatePresence>
            </div>
          </form>

          {/* Register link */}
          <p style={{ textAlign: "center", fontSize: 14, color: "#9B7E6A", marginTop: 24 }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "#6B1E2B", fontWeight: 700, textDecoration: "none" }}>Create one now</Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Visual Panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F0E8", position: "relative", overflow: "hidden" }}>
        {/* Subtle texture dots */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#D4C0A8 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.5 }} />
        {/* Warm glow */}
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(107,30,43,0.08) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ position: "relative", zIndex: 1, padding: 48, maxWidth: 420, textAlign: "center" }}
        >
          {/* Animated icon */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 96, height: 96, borderRadius: 24, background: "#FDFAF5", border: "1.5px solid #E2D5C3", boxShadow: "0 20px 60px rgba(107,30,43,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", fontSize: 42 }}>
            🛡️
          </motion.div>

          <h2 style={{ fontSize: 38, fontWeight: 900, color: "#2A1A0E", fontFamily: "'Playfair Display', serif", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Enterprise-grade<br />
            <span style={{ color: "#6B1E2B" }}>security.</span>
          </h2>
          <p style={{ fontSize: 16, color: "#7A6355", lineHeight: 1.7, marginBottom: 36 }}>
            Our multi-engine consensus models ensure zero false positives and absolute compliance with HIPAA and GDPR standards.
          </p>

          {/* Trust badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TRUST_BADGES.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderRadius: 12, background: "#FDFAF5", border: "1px solid #E2D5C3" }}>
                <badge.icon size={16} style={{ color: "#6B1E2B", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#4A2A1E" }}>{badge.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Stat */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ marginTop: 28, padding: "18px 24px", borderRadius: 14, background: "#6B1E2B" }}>
            <p style={{ fontSize: 36, fontWeight: 900, color: "#FDFAF5", fontFamily: "'Playfair Display', serif" }}>99.8%</p>
            <p style={{ fontSize: 12, color: "rgba(253,250,245,0.65)", marginTop: 4 }}>Detection accuracy across 1,247+ documents</p>
          </motion.div>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
