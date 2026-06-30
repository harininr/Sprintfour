import React, { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Features", "How It Works", "Security", "FAQ"];

const STATS = [
  { value: 99.8, suffix: "%", label: "Detection Accuracy", decimals: 1 },
  { value: 1247, suffix: "+", label: "Documents Processed", decimals: 0 },
  { value: 892, suffix: "+", label: "Organizations", decimals: 0 },
  { value: 47, suffix: "ms", label: "Avg Scan Speed", decimals: 0 },
];

const FEATURES = [
  { icon: "⚡", title: "Triple AI Consensus", desc: "Gemini 2.5 Flash, Llama 3.3 70B, and Claude 3 Haiku run simultaneously. PII is flagged only when models agree — eliminating false positives.", badge: "Core Engine" },
  { icon: "📄", title: "Rich Document Preservation", desc: "Upload a .docx and see it rendered exactly as formatted — tables, headings, bold text, lists — while AI detection runs on the underlying plain text.", badge: "DOCX Support" },
  { icon: "🎯", title: "Human-in-the-Loop Review", desc: "Accept, reject, or ignore every AI suggestion. Color-coded by severity with model consensus counts. Full keyboard navigation included.", badge: "Review Interface" },
  { icon: "🔍", title: "Blind-Spot Detection", desc: "After confirming a redaction, the system automatically finds every other occurrence of that same entity across the entire document.", badge: "Smart Scan" },
  { icon: "🛡️", title: "Final Safety Scan", desc: "Post-review AI verification catches any critical PII that may have slipped through — SSNs, credit cards, medical IDs — before final export.", badge: "Safety Net" },
  { icon: "📥", title: "Secure PDF Export", desc: "Generate permanently redacted PDFs with opaque black bars over every confirmed PII span. Irreversible. Compliant. Production-ready.", badge: "Export" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Upload Your Document", desc: "Drag and drop any .docx, .pdf, or .txt file. Rich HTML is extracted for display; plain text for AI analysis." },
  { step: "02", title: "AI Consensus Runs", desc: "Three LLMs scan in parallel. Results are merged, deduplicated, and confidence scores calculated based on model agreement." },
  { step: "03", title: "Human Review", desc: "Review the document with color-coded highlights. Accept, reject, or ignore each detection. Add your own redactions by selecting text." },
  { step: "04", title: "Export & Certify", desc: "Run a final safety scan, view your compliance intelligence report, then download a permanently redacted PDF." },
];

const PII_CATEGORIES = [
  { name: "SSN", severity: "critical", color: "#8B2535" },
  { name: "Financial", severity: "critical", color: "#8B2535" },
  { name: "Medical ID", severity: "high", color: "#B45309" },
  { name: "Phone Number", severity: "high", color: "#B45309" },
  { name: "Date of Birth", severity: "high", color: "#B45309" },
  { name: "Email Address", severity: "medium", color: "#92400E" },
  { name: "Home Address", severity: "medium", color: "#92400E" },
  { name: "Full Name", severity: "low", color: "#166534" },
  { name: "Organization", severity: "low", color: "#166534" },
  { name: "Other PII", severity: "low", color: "#166534" },
];

const TESTIMONIALS = [
  { quote: "Redact Review cut our document review time by 70%. The consensus model is brilliant — we stopped seeing false positives that plagued our previous tool.", author: "Sarah Chen", role: "Chief Privacy Officer", company: "HealthBridge Corp", avatar: "SC" },
  { quote: "Three different AI models agreeing before flagging anything gave our legal team the confidence to fully trust the output. Truly enterprise-grade.", author: "Marcus Williams", role: "Head of Compliance", company: "Meridian Law Partners", avatar: "MW" },
  { quote: "We process thousands of HIPAA documents monthly. Redact Review handles them all with precision we couldn't achieve manually. Game-changer.", author: "Dr. Priya Nair", role: "Clinical Data Officer", company: "NovaMed Systems", avatar: "PN" },
];

const FAQS = [
  { q: "How does the consensus detection work?", a: "Three AI models (Gemini 2.5 Flash, Llama 3.3 70B via Groq, Claude 3 Haiku via OpenRouter) scan the text simultaneously. Each returns detected PII spans. The system maps all detections to character offsets, groups overlapping spans, and counts model agreement. Entities confirmed by 2–3 models are high confidence; those flagged by 1 model are marked 'Second Opinion' for human review." },
  { q: "What file formats are supported?", a: "We support .docx/.doc (Word), .txt, .md (Markdown), and .pdf. DOCX files get special treatment — we use Mammoth to extract rich HTML preserving tables and formatting. PDFs are processed with pdf-parse, and redactions are applied directly to original PDF pages using bounding boxes." },
  { q: "Is my data secure?", a: "Uploaded files are processed in-memory — only extracted text is persisted to the database. HTML output is sanitized to strip scripts and event handlers. Exported PDFs use opaque black rectangles over the text layer. All packages are subject to a 24-hour supply-chain protection delay." },
  { q: "What compliance standards does it help with?", a: "Redact Review's detection categories map directly to GDPR, HIPAA, CCPA, and SOC 2 data types: SSNs, financial identifiers, medical records, names, dates of birth, addresses, and more. The Intelligence Report provides a risk score and compliance checklist per document." },
  { q: "Can I add redactions manually?", a: "Yes. In the Review Workspace, select any text in the document and assign it a PII category. This creates a 'user-added' redaction tracked separately in the audit log. You can also reject false positives — all decisions are recorded for compliance reporting." },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimCounter({ target, suffix, decimals }: { target: number; suffix: string; decimals: number }) {
  const [val, setVal] = useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  const started = React.useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1800;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(ease * target);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {decimals > 0 ? val.toFixed(decimals) : Math.floor(val).toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      const d = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(d > 0 ? (window.scrollY / d) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const C = {
    bg: "#F5F0E8",
    surface: "#FDFAF5",
    border: "#E2D5C3",
    maroon: "#6B1E2B",
    maroonDark: "#4A1520",
    maroonLight: "#8B2535",
    text: "#2A1A0E",
    textMid: "#5A3E30",
    textLight: "#9B7E6A",
    gold: "#B45309",
  };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; }

        .scroll-bar {
          position: fixed; top: 0; left: 0; height: 3px;
          background: linear-gradient(90deg, #6B1E2B, #B45309);
          z-index: 9999; transition: width 0.05s linear;
          box-shadow: 0 0 8px rgba(107,30,43,0.4);
        }

        .nav-wrap {
          background: rgba(253,250,245,0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #E2D5C3;
          transition: box-shadow 0.3s;
        }
        .nav-wrap.scrolled { box-shadow: 0 4px 24px rgba(107,30,43,0.1); }

        .nav-link {
          color: #7A6355; font-size: 14px; font-weight: 500;
          text-decoration: none; transition: color 0.2s;
          letter-spacing: 0.01em;
        }
        .nav-link:hover { color: #6B1E2B; }

        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 28px;
          background: linear-gradient(135deg, #6B1E2B, #8B2535);
          color: #FDFAF5; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.25s ease; letter-spacing: 0.01em;
          box-shadow: 0 4px 20px rgba(107,30,43,0.3);
          position: relative; overflow: hidden;
        }
        .btn-primary::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transition: left 0.5s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(107,30,43,0.35); }
        .btn-primary:hover::before { left: 100%; }

        .btn-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 28px;
          background: #FDFAF5; color: #6B1E2B;
          border: 1.5px solid #D4B8A0; border-radius: 12px;
          font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s; letter-spacing: 0.01em;
        }
        .btn-secondary:hover {
          background: #F5EDE0; border-color: #6B1E2B;
          transform: translateY(-1px);
        }

        .feature-card {
          background: #FDFAF5; border: 1.5px solid #E2D5C3;
          border-radius: 20px; padding: 32px; transition: all 0.3s;
        }
        .feature-card:hover {
          border-color: #6B1E2B; transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(107,30,43,0.12);
        }

        .stat-card {
          background: #FDFAF5; border: 1.5px solid #E2D5C3;
          border-radius: 18px; padding: 28px 20px; text-align: center; transition: all 0.3s;
        }
        .stat-card:hover {
          border-color: #6B1E2B; transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(107,30,43,0.1);
        }

        .step-card {
          background: #FDFAF5; border: 1.5px solid #E2D5C3;
          border-radius: 20px; padding: 32px; transition: all 0.3s;
        }
        .step-card:hover { border-color: #6B1E2B; box-shadow: 0 12px 36px rgba(107,30,43,0.1); }

        .testimonial-card {
          background: #FDFAF5; border: 1.5px solid #E2D5C3;
          border-radius: 20px; padding: 32px; transition: all 0.3s;
        }
        .testimonial-card:hover {
          border-color: #6B1E2B; transform: translateY(-3px);
          box-shadow: 0 12px 36px rgba(107,30,43,0.1);
        }

        .faq-item { border-bottom: 1.5px solid #E2D5C3; }
        .faq-question {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 22px 0; background: none; border: none; color: #2A1A0E;
          font-size: 16px; font-weight: 600; cursor: pointer; text-align: left; gap: 16px;
          font-family: 'Inter', sans-serif; transition: color 0.2s;
        }
        .faq-question:hover { color: #6B1E2B; }

        .dot-grid {
          background-image: radial-gradient(#D4C0A8 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .serif { font-family: 'Playfair Display', serif; }

        .badge-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        .mobile-nav {
          position: fixed; top: 0; right: 0; bottom: 0; width: min(300px, 85vw);
          background: #FDFAF5; border-left: 1.5px solid #E2D5C3;
          z-index: 9998; transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
          padding: 80px 28px 28px; display: flex; flex-direction: column; gap: 4px;
          box-shadow: -8px 0 40px rgba(107,30,43,0.1);
        }
        .mobile-nav.open { transform: translateX(0); }
        .mobile-overlay {
          position: fixed; inset: 0; background: rgba(42,26,14,0.3);
          z-index: 9997; opacity: 0; pointer-events: none; transition: opacity 0.3s;
          backdrop-filter: blur(4px);
        }
        .mobile-overlay.open { opacity: 1; pointer-events: all; }
        .mobile-nav-link {
          display: block; padding: 13px 16px; color: #5A3E30; font-size: 15px;
          font-weight: 500; text-decoration: none; border-radius: 10px; transition: all 0.2s;
        }
        .mobile-nav-link:hover { background: rgba(107,30,43,0.07); color: #6B1E2B; }

        .footer-link { color: #9B7E6A; font-size: 13px; text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: #6B1E2B; }

        .doc-preview {
          background: #FDFAF5; border: 1.5px solid #E2D5C3; border-radius: 18px;
          box-shadow: 0 24px 80px rgba(107,30,43,0.15), 0 4px 16px rgba(107,30,43,0.08);
        }

        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 901px) {
          .show-mobile { display: none !important; }
        }
      `}</style>

      {/* Scroll bar */}
      <div className="scroll-bar" style={{ width: `${scrollPct}%` }} />

      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className={`nav-wrap ${scrollY > 40 ? "scrolled" : ""}`}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "0 24px", height: 66 }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6B1E2B, #8B2535)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(107,30,43,0.35)", fontSize: 18 }}>🛡️</div>
            <span className="serif" style={{ fontSize: 18, fontWeight: 800, color: "#2A1A0E" }}>Redact Review</span>
          </Link>

          <div className="hide-mobile" style={{ display: "flex", gap: 32 }}>
            {NAV_LINKS.map(l => <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="nav-link">{l}</a>)}
          </div>

          <div className="hide-mobile" style={{ display: "flex", gap: 10 }}>
            <Link href="/login" className="btn-secondary" style={{ padding: "9px 18px", fontSize: 13 }}>Sign In</Link>
            <Link href="/register" className="btn-primary" style={{ padding: "9px 18px", fontSize: 13 }}>Get Started Free</Link>
          </div>

          <button className="show-mobile" onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "#FDFAF5", border: "1.5px solid #E2D5C3", borderRadius: 9, padding: "8px 11px", cursor: "pointer", color: "#6B1E2B", fontSize: 16, display: "none" }}>
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className={`mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
        {NAV_LINKS.map(l => <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="mobile-nav-link" onClick={() => setMobileOpen(false)}>{l}</a>)}
        <div style={{ height: 1, background: "#E2D5C3", margin: "12px 0" }} />
        <Link href="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Sign In</Link>
        <Link href="/register" className="btn-primary" style={{ marginTop: 8 }} onClick={() => setMobileOpen(false)}>Get Started Free</Link>
      </div>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 100, paddingBottom: 80, position: "relative" }}>
        <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.6, pointerEvents: "none" }} />
        {/* Warm glow */}
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(107,30,43,0.07) 0%, transparent 70%)", top: "50%", left: "30%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", width: "100%", position: "relative" }}>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>

            {/* Copy */}
            <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              {/* Evaluator badge — PROMINENT at top of hero */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                style={{ marginBottom: 24, display: "inline-block" }}
              >
                <Link href="/login"
                  style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 12, background: "linear-gradient(135deg, #6B1E2B, #8B2535)", boxShadow: "0 6px 24px rgba(107,30,43,0.3)", textDecoration: "none" }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#FDFAF5", letterSpacing: "0.03em" }}>Evaluator? Click here → Instant Access</p>
                    <p style={{ fontSize: 11, color: "rgba(253,250,245,0.65)", marginTop: 1 }}>harinin006@gmail.com / Harini@0504 — no typing needed</p>
                  </div>
                </Link>
              </motion.div>

              <h1 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.025em", marginBottom: 20, color: "#2A1A0E" }}>
                Redact with<br />
                <span style={{ color: "#6B1E2B" }}>Precision.</span><br />
                Review with<br />Confidence.
              </h1>

              <p style={{ fontSize: 17, lineHeight: 1.7, color: "#7A6355", marginBottom: 36, maxWidth: 480 }}>
                The only PII redaction platform that runs <strong style={{ color: "#2A1A0E", fontWeight: 700 }}>three AI models simultaneously</strong> and flags entities only when they agree — eliminating false positives at scale.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
                <Link href="/register" className="btn-primary" style={{ padding: "15px 32px", fontSize: 16 }}>Start for Free →</Link>
                <a href="#how-it-works" className="btn-secondary" style={{ padding: "15px 32px", fontSize: 16 }}>See How It Works</a>
              </div>

              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex" }}>
                  {["SC","MW","PN","AR","KL"].map((init, i) => (
                    <div key={i} style={{ width: 34, height: 34, borderRadius: "50%", background: i % 2 === 0 ? "#6B1E2B" : "#4A1520", border: "2px solid #F5F0E8", marginLeft: i > 0 ? -9 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#FDFAF5" }}>
                      {init}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 1, marginBottom: 2 }}>
                    {[0,1,2,3,4].map(i => <span key={i} style={{ color: "#B45309", fontSize: 12 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 12, color: "#9B7E6A" }}>Trusted by <strong style={{ color: "#2A1A0E" }}>892+ organizations</strong></p>
                </div>
              </div>
            </motion.div>

            {/* Doc preview */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative" }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="doc-preview"
                style={{ padding: 28 }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 11, color: "#9B7E6A" }}>AI Scanning…</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#9B7E6A", fontFamily: "monospace", marginBottom: 14 }}>employment_agreement.docx</div>

                {/* Lines */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ height: 10, borderRadius: 5, width: "60%", background: "#E2D5C3" }} />
                  <div style={{ height: 6 }} />
                  {[
                    { w: "32%", tag: "████████", cat: "SSN", color: "#8B2535", tagColor: "#FFF0F0", tagBorder: "#F5B8B8" },
                    { w: "40%", tag: "+91 ████████", cat: "Phone", color: "#B45309", tagColor: "#FFF8EC", tagBorder: "#F5D090" },
                    null,
                    { w: "22%", tag: "████@████.com", cat: "Email", color: "#92400E", tagColor: "#FFFBEC", tagBorder: "#F5E090" },
                    null,
                    null,
                    { w: "34%", tag: "John S.", cat: "Name", color: "#166534", tagColor: "#F0FFF4", tagBorder: "#90F5B8" },
                    null,
                  ].map((row, i) =>
                    row === null ? (
                      <div key={i} style={{ height: 10, borderRadius: 5, width: `${55 + (i * 7) % 35}%`, background: "#EDE4D8" }} />
                    ) : (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ height: 10, borderRadius: 5, width: row.w, background: "#EDE4D8" }} />
                        <div style={{ padding: "3px 8px", borderRadius: 5, background: row.tagColor, border: `1px solid ${row.tagBorder}`, fontSize: 10, color: row.color, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {row.tag} · {row.cat}
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E2D5C3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "#8B2535", fontWeight: 600 }}>● 2 Critical</span>
                    <span style={{ fontSize: 11, color: "#B45309", fontWeight: 600 }}>● 3 High</span>
                    <span style={{ fontSize: 11, color: "#92400E", fontWeight: 600 }}>● 1 Medium</span>
                  </div>
                  <div style={{ padding: "4px 10px", borderRadius: 6, background: "#6B1E2B", fontSize: 10, color: "#FDFAF5", fontWeight: 700 }}>
                    Review Now →
                  </div>
                </div>
              </motion.div>

              {/* Floating badges */}
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", top: -18, right: -16, padding: "10px 14px", borderRadius: 12, background: "#FDFAF5", border: "1.5px solid #E2D5C3", boxShadow: "0 8px 24px rgba(107,30,43,0.12)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#2A1A0E" }}>3 / 3 Models Agree</p>
                    <p style={{ fontSize: 10, color: "#9B7E6A" }}>High confidence</p>
                  </div>
                </div>
              </motion.div>

              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                style={{ position: "absolute", bottom: -14, left: -20, padding: "10px 14px", borderRadius: 12, background: "#FDFAF5", border: "1.5px solid #E2D5C3", boxShadow: "0 8px 24px rgba(107,30,43,0.12)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🛡️</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#2A1A0E" }}>99.8% Accuracy</p>
                    <p style={{ fontSize: 10, color: "#9B7E6A" }}>1,247 docs processed</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #D4C0A8, transparent)", marginBottom: 56 }} />
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
            {STATS.map((s, i) => (
              <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="serif" style={{ fontSize: 40, fontWeight: 900, color: "#6B1E2B", letterSpacing: "-0.02em", marginBottom: 6 }}>
                  <AnimCounter target={s.value} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <p style={{ fontSize: 13, color: "#9B7E6A", fontWeight: 500 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #D4C0A8, transparent)", marginTop: 56 }} />
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="badge-pill" style={{ background: "rgba(107,30,43,0.08)", border: "1px solid rgba(107,30,43,0.18)", color: "#6B1E2B", marginBottom: 18 }}>
              <span>Platform Capabilities</span>
            </div>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, marginBottom: 14, color: "#2A1A0E" }}>
              Everything you need for<br />
              <span style={{ color: "#6B1E2B" }}>bulletproof redaction.</span>
            </h2>
            <p style={{ fontSize: 17, color: "#7A6355", maxWidth: 520, margin: "0 auto" }}>
              From upload to export, every step engineered for precision, auditability, and compliance.
            </p>
          </motion.div>

          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} className="feature-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <div style={{ width: 50, height: 50, borderRadius: 13, background: "rgba(107,30,43,0.08)", border: "1px solid rgba(107,30,43,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 18 }}>
                  {f.icon}
                </div>
                <div className="badge-pill" style={{ background: "rgba(107,30,43,0.07)", border: "1px solid rgba(107,30,43,0.14)", color: "#6B1E2B", marginBottom: 12, fontSize: 10 }}>
                  {f.badge}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#2A1A0E" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#7A6355" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "96px 24px", background: "#FDFAF5" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="badge-pill" style={{ background: "rgba(22,101,52,0.08)", border: "1px solid rgba(22,101,52,0.2)", color: "#166534", marginBottom: 18 }}>
              Simple by Design
            </div>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: "#2A1A0E" }}>
              From upload to certified clean<br /><span style={{ color: "#6B1E2B" }}>— in minutes.</span>
            </h2>
          </motion.div>

          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, position: "relative" }}>
            <div style={{ position: "absolute", top: 38, left: "12%", right: "12%", height: 1, background: "linear-gradient(90deg, transparent, #D4B8A0, #D4B8A0, transparent)" }} />
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} className="step-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "linear-gradient(135deg, #6B1E2B, #8B2535)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <span className="serif" style={{ fontSize: 16, fontWeight: 900, color: "#FDFAF5" }}>{step.step}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: "#2A1A0E" }}>{step.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "#7A6355" }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PII CATEGORIES ─────────────────────────────────────────────── */}
      <section id="security" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="badge-pill" style={{ background: "rgba(107,30,43,0.08)", border: "1px solid rgba(107,30,43,0.18)", color: "#6B1E2B", marginBottom: 20 }}>
                10 PII Categories
              </div>
              <h2 className="serif" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, marginBottom: 18, color: "#2A1A0E" }}>
                Comprehensive<br />
                <span style={{ color: "#6B1E2B" }}>detection coverage.</span>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "#7A6355", marginBottom: 28 }}>
                From critical identifiers like SSNs and financial data to low-severity entities like names — every category weighted by severity for accurate risk scoring.
              </p>
              <Link href="/register" className="btn-primary">Start Detecting PII →</Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {PII_CATEGORIES.map((cat, i) => (
                <motion.div key={cat.name} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 100, background: "#FDFAF5", border: `1.5px solid ${cat.color}30`, fontSize: 13, fontWeight: 600, color: cat.color }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: cat.color, display: "block" }} />
                  {cat.name}
                  <span style={{ color: "#9B7E6A", fontWeight: 400 }}>· {cat.severity}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: "#FDFAF5" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: "#2A1A0E" }}>
              Trusted by compliance<br /><span style={{ color: "#6B1E2B" }}>teams worldwide.</span>
            </h2>
          </motion.div>
          <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.author} className="testimonial-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[0,1,2,3,4].map(j => <span key={j} style={{ color: "#B45309", fontSize: 13 }}>★</span>)}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: "#5A3E30", marginBottom: 22, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#6B1E2B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#FDFAF5", flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#2A1A0E" }}>{t.author}</p>
                    <p style={{ fontSize: 12, color: "#9B7E6A" }}>{t.role}, {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="serif" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: "#2A1A0E", marginBottom: 12 }}>
              Frequently asked <span style={{ color: "#6B1E2B" }}>questions.</span>
            </h2>
            <p style={{ fontSize: 15, color: "#7A6355" }}>Everything you need to know about Redact Review.</p>
          </motion.div>

          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item">
              <button className="faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${activeFaq === i ? "#6B1E2B" : "#E2D5C3"}`, display: "flex", alignItems: "center", justifyContent: "center", color: activeFaq === i ? "#6B1E2B" : "#9B7E6A", fontSize: 18, flexShrink: 0, transition: "all 0.2s", background: activeFaq === i ? "rgba(107,30,43,0.07)" : "transparent" }}>
                  {activeFaq === i ? "−" : "+"}
                </div>
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: 15, lineHeight: 1.75, color: "#5A3E30", paddingBottom: 22 }}>{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "64px 24px 100px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ padding: "72px 56px", borderRadius: 28, background: "linear-gradient(135deg, #6B1E2B 0%, #4A1520 50%, #6B1E2B 100%)", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(253,250,245,0.06) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: 52, marginBottom: 22 }}>🛡️</motion.div>
              <h2 className="serif" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#FDFAF5", marginBottom: 14 }}>
                Ready to redact with absolute confidence?
              </h2>
              <p style={{ fontSize: 16, color: "rgba(253,250,245,0.65)", marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
                Join 892+ organizations who trust Redact Review. Start free, no credit card required.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 40px", background: "#FDFAF5", color: "#6B1E2B", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#F5F0E8"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#FDFAF5"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}>
                  Start for Free →
                </Link>
                <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 40px", background: "rgba(253,250,245,0.1)", color: "#FDFAF5", border: "1.5px solid rgba(253,250,245,0.3)", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", textDecoration: "none", transition: "all 0.2s" }}>
                  Sign In
                </Link>
              </div>
              <p style={{ marginTop: 18, fontSize: 12, color: "rgba(253,250,245,0.35)" }}>No credit card · Instant access · GDPR & HIPAA aligned</p>

              {/* Evaluator credentials */}
              <div style={{ marginTop: 32, padding: "16px 22px", borderRadius: 14, background: "rgba(253,250,245,0.08)", border: "1px solid rgba(253,250,245,0.2)", display: "inline-flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(253,250,245,0.5)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Evaluator Quick Access</p>
                  <p style={{ fontSize: 12, color: "rgba(253,250,245,0.4)", fontFamily: "monospace" }}>harinin006@gmail.com · Harini@0504</p>
                </div>
                <Link href="/login" style={{ padding: "8px 16px", borderRadius: 8, background: "#FDFAF5", color: "#6B1E2B", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                  Quick Login →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ padding: "40px 24px", borderTop: "1.5px solid #E2D5C3", background: "#FDFAF5" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #6B1E2B, #8B2535)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🛡️</div>
            <span className="serif" style={{ fontSize: 15, fontWeight: 700, color: "#2A1A0E" }}>Redact Review</span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {["Privacy Policy", "Terms of Service", "Security", "Documentation"].map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
          </div>
          <p style={{ fontSize: 12, color: "#B8A898" }}>© 2025 Redact Review · Built with ❤️ by Harini N R</p>
        </div>
      </footer>
    </div>
  );
}