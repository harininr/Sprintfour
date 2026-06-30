import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User, Shield, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const FEATURES = [
  { icon: Shield, title: "Military-grade Security", desc: "End-to-end encryption on every document" },
  { icon: Sparkles, title: "AI Consensus Engine", desc: "3 models collaborating for zero misses" },
  { icon: CheckCircle, title: "Compliance Automation", desc: "GDPR, HIPAA and SOC 2 built-in" },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [strength, setStrength] = useState(0);

  const calcStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    setStrength(s);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { toast.error("Please fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    setTimeout(() => {
      setRegisterSuccess(true);
      setTimeout(() => {
        login({ id: "usr_mock_123", name, email });
        toast.success("Account created! Welcome aboard.");
        setLocation("/dashboard");
      }, 700);
      setIsLoading(false);
    }, 1500);
  };

  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F5F0E8", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&display=swap');
        .reg-field {
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
        .reg-field::placeholder { color: #B8A898; }
        .reg-field:focus {
          border-color: #6B1E2B;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(107,30,43,0.1);
        }
        .reg-btn-primary {
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
        .reg-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #7D2334 0%, #9E2D3F 100%);
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(107,30,43,0.35);
        }
        .reg-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .reg-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #9B7E6A;
          margin-bottom: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Left — Visual Panel */}
      <div style={{ flex: 1, display: "none", alignItems: "center", justifyContent: "center", background: "#F5F0E8", position: "relative", overflow: "hidden" }} className="reg-visual">
        <style>{`.reg-visual { display: flex !important; } @media (max-width: 900px) { .reg-visual { display: none !important; } }`}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#D4C0A8 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.5 }} />
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(107,30,43,0.08) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ position: "relative", zIndex: 1, padding: 48, maxWidth: 400, textAlign: "center" }}
        >
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 96, height: 96, borderRadius: 24, background: "#FDFAF5", border: "1.5px solid #E2D5C3", boxShadow: "0 20px 60px rgba(107,30,43,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", fontSize: 42 }}>
            ✨
          </motion.div>

          <h2 style={{ fontSize: 38, fontWeight: 900, color: "#2A1A0E", fontFamily: "'Playfair Display', serif", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Privacy meets<br />
            <span style={{ color: "#6B1E2B" }}>intelligence.</span>
          </h2>
          <p style={{ fontSize: 15, color: "#7A6355", lineHeight: 1.7, marginBottom: 36 }}>
            Join leading organizations in securing their most sensitive documents with AI-powered redaction.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, background: "#FDFAF5", border: "1px solid #E2D5C3", textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(107,30,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <feat.icon size={16} style={{ color: "#6B1E2B" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#2A1A0E", marginBottom: 2 }}>{feat.title}</p>
                  <p style={{ fontSize: 12, color: "#9B7E6A" }}>{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 24, padding: "14px 18px", borderRadius: 12, background: "#6B1E2B", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex" }}>
              {["SC","MW","PN"].map((init, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? "#8B2535" : i === 1 ? "#4A1520" : "#2A0D10", border: "2px solid #6B1E2B", marginLeft: i > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#FDFAF5" }}>
                  {init}
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#FDFAF5" }}>892+ organizations</p>
              <p style={{ fontSize: 11, color: "rgba(253,250,245,0.55)" }}>already securing their data</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right — Form Panel */}
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", padding: "48px 64px", background: "#FDFAF5", boxShadow: "-4px 0 40px rgba(107,30,43,0.06)" }}>
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
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 100, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", letterSpacing: "0.06em", textTransform: "uppercase" }}>Free to get started</span>
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 900, color: "#2A1A0E", fontFamily: "'Playfair Display', serif", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Create your<br />
              <span style={{ color: "#6B1E2B" }}>account.</span>
            </h1>
            <p style={{ fontSize: 15, color: "#7A6355", lineHeight: 1.65 }}>
              Start auditing documents with multi-engine AI consensus in under a minute.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Name */}
            <div>
              <label className="reg-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: focusedField === "name" ? "#6B1E2B" : "#B8A898", pointerEvents: "none", transition: "color 0.2s" }} />
                <input type="text" className="reg-field" value={name} onChange={e => setName(e.target.value)}
                  onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                  placeholder="John Doe" autoComplete="name" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="reg-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: focusedField === "email" ? "#6B1E2B" : "#B8A898", pointerEvents: "none", transition: "color 0.2s" }} />
                <input type="email" className="reg-field" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  placeholder="name@company.com" autoComplete="email" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="reg-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: focusedField === "password" ? "#6B1E2B" : "#B8A898", pointerEvents: "none", transition: "color 0.2s" }} />
                <input type={showPassword ? "text" : "password"} className="reg-field" style={{ paddingRight: 48 }}
                  value={password} onChange={e => { setPassword(e.target.value); calcStrength(e.target.value); }}
                  onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                  placeholder="Create a strong password" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#B8A898", padding: 0, display: "flex" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: i < strength ? strengthColors[strength - 1] : "#E2D5C3", transition: "background 0.3s" }} />
                  ))}
                  {strength > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: strengthColors[strength - 1], marginLeft: 4 }}>{strengthLabels[strength - 1]}</span>}
                </div>
              )}
            </div>

            {/* Terms */}
            <p style={{ fontSize: 12, color: "#9B7E6A", lineHeight: 1.6 }}>
              By creating an account, you agree to our{" "}
              <a href="#" style={{ color: "#6B1E2B", fontWeight: 600, textDecoration: "none" }}>Terms of Service</a> and{" "}
              <a href="#" style={{ color: "#6B1E2B", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</a>.
            </p>

            <div>
              <AnimatePresence mode="wait">
                {registerSuccess ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="reg-btn-primary" style={{ background: "linear-gradient(135deg, #1a5c2a, #236b33)", pointerEvents: "none" }}>
                    <CheckCircle size={18} /><span>Account Created!</span>
                  </motion.div>
                ) : (
                  <button type="submit" className="reg-btn-primary" disabled={isLoading}>
                    {isLoading
                      ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                      : <><span>Create Account</span><ArrowRight size={16} /></>}
                  </button>
                )}
              </AnimatePresence>
            </div>
          </form>

          <p style={{ textAlign: "center", fontSize: 14, color: "#9B7E6A", marginTop: 20 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#6B1E2B", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
