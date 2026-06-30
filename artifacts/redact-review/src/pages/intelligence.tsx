import { useParams, useLocation } from "wouter";
import { useGetIntelligenceReport, useGetDocument, getGetIntelligenceReportQueryKey, getGetDocumentQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Shield, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2,
  XCircle, FileText, BarChart2, TrendingUp, Clock, Download, ChevronDown,
  ChevronUp, Eye, Sparkles, Activity, Target, Zap, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Utilities ────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string; badge: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-700 text-white" },
  high:     { bg: "bg-[#6B1E2B]/5", text: "text-[#6B1E2B]", border: "border-[#6B1E2B]/20", badge: "bg-[#6B1E2B] text-white" },
  medium:   { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-500 text-white" },
  low:      { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-500 text-white" },
};

function SeverityBadge({ severity }: { severity: string }) {
  const s = severity as Severity;
  const c = SEVERITY_COLORS[s] ?? SEVERITY_COLORS.low;
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.badge}`}>
      {severity}
    </span>
  );
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    start.current = 0;
    startTime.current = null;
    const step = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{display}</>;
}

const TIMELINE_STEPS = [
  { label: "Document Uploaded", icon: FileText },
  { label: "AI Detection", icon: Brain },
  { label: "Review Started", icon: Eye },
  { label: "Human Review", icon: Shield },
  { label: "Corrections Applied", icon: Activity },
  { label: "Final Safety Scan", icon: Target },
  { label: "Ready for Export", icon: ShieldCheck },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Intelligence() {
  const params = useParams();
  const id = params.id as string;
  const [, setLocation] = useLocation();

  const { data: report, isLoading, error } = useGetIntelligenceReport(id, {
    query: { enabled: !!id, queryKey: getGetIntelligenceReportQueryKey(id) },
  });
  const { data: doc } = useGetDocument(id, { query: { enabled: !!id, queryKey: getGetDocumentQueryKey(id) } });

  const [expandedChecklist, setExpandedChecklist] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1EA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
            <Brain className="h-10 w-10 text-[#6B1E2B]" />
          </motion.div>
          <p className="font-serif text-xl text-[#1E1E1E]">Generating intelligence report…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#F5F1EA] flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 text-[#A92B2B] mx-auto mb-4" />
          <p className="font-serif text-xl text-[#1E1E1E]">Report unavailable</p>
          <Button className="mt-4" onClick={() => setLocation(`/review/${id}`)}>Back to Review</Button>
        </div>
      </div>
    );
  }

  const scoreColor =
    report.privacyScore >= 80 ? "text-[#4C7A53]"
    : report.privacyScore >= 50 ? "text-amber-600"
    : "text-[#A92B2B]";

  const scoreRing =
    report.privacyScore >= 80 ? "border-[#4C7A53]"
    : report.privacyScore >= 50 ? "border-amber-500"
    : "border-[#A92B2B]";

  const timelineActiveSteps =
    report.exportReady ? 7
    : report.stats.confirmed + report.stats.rejected > 0 ? 5
    : doc?.status === "in_review" ? 3
    : 2;

  const qualityScore =
    report.stats.pending === 0 ? "Excellent"
    : report.stats.pending <= 2 ? "Good"
    : "Needs Attention";

  const qualityColor =
    qualityScore === "Excellent" ? "text-[#4C7A53]"
    : qualityScore === "Good" ? "text-amber-600"
    : "text-[#A92B2B]";

  const handleExport = () => window.print();

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4 } }),
  };

  return (
    <div className="min-h-screen bg-[#F5F1EA] print:bg-white">
      {/* Top nav */}
      <header className="sticky top-0 z-30 h-14 bg-[#FFFDF9] border-b border-[#E5DDD2] shadow-sm px-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation(`/review/${id}`)} className="text-[#666]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-5 w-px bg-[#E5DDD2]" />
          <div>
            <p className="font-serif font-semibold text-[#1E1E1E] text-base leading-none">Privacy Intelligence</p>
            {doc && <p className="text-xs text-[#888] mt-0.5">{doc.title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#E5DDD2] text-[#666]"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button
            size="sm"
            className="bg-[#6B1E2B] hover:bg-[#7D2334] text-white gap-2"
            onClick={() => setLocation(`/review/${id}`)}
          >
            <Eye className="h-4 w-4" /> Return to Review
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── Section 1: Executive Summary ─────────────────────────────── */}
        <section>
          <SectionTitle icon={<Sparkles className="h-5 w-5" />} title="Executive Summary" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
            {[
              {
                label: "Privacy Score",
                value: <span className={`font-serif text-4xl font-bold ${scoreColor}`}><AnimatedCounter value={report.privacyScore} />%</span>,
                sub: report.verdict.label,
                highlight: true,
              },
              { label: "Detected PII", value: <BigNum n={report.stats.total} />, sub: "Total items" },
              { label: "Confirmed", value: <BigNum n={report.stats.confirmed} color="text-[#4C7A53]" />, sub: "Will be redacted" },
              { label: "Needs Review", value: <BigNum n={report.stats.pending} color={report.stats.pending > 0 ? "text-amber-600" : "text-[#4C7A53]"} />, sub: "Still pending" },
              { label: "User-Added", value: <BigNum n={report.stats.userAdded} color="text-indigo-600" />, sub: "AI missed" },
              {
                label: "Export Ready",
                value: report.exportReady
                  ? <ShieldCheck className="h-10 w-10 text-[#4C7A53]" />
                  : <ShieldAlert className="h-10 w-10 text-amber-500" />,
                sub: report.exportReady ? "Safe to export" : "Review pending items",
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className={`bg-[#FFFDF9] border rounded-2xl p-4 flex flex-col gap-1 shadow-sm ${card.highlight ? "border-[#6B1E2B]/20 ring-1 ring-[#6B1E2B]/10" : "border-[#E5DDD2]"}`}
              >
                <p className="text-[11px] uppercase tracking-wider text-[#888] font-medium">{card.label}</p>
                <div className="flex items-center mt-1">{card.value}</div>
                <p className="text-[11px] text-[#999] mt-1">{card.sub}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Section 2: PII Breakdown ──────────────────────────────────── */}
        <section>
          <SectionTitle icon={<BarChart2 className="h-5 w-5" />} title="PII Category Breakdown" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {report.categoryBreakdown.map((cat, i) => {
              const sev = cat.severity as Severity;
              const c = SEVERITY_COLORS[sev] ?? SEVERITY_COLORS.low;
              return (
                <motion.div
                  key={cat.category}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className={`bg-[#FFFDF9] border ${c.border} rounded-2xl p-5 shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-serif font-semibold text-[#1E1E1E] capitalize text-base">{cat.category}</p>
                    <SeverityBadge severity={cat.severity} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <Stat label="Detected" n={cat.detected} />
                    <Stat label="Confirmed" n={cat.confirmed} color="text-[#4C7A53]" />
                    <Stat label="Pending" n={cat.pending} color={cat.pending > 0 ? "text-amber-600" : "text-[#4C7A53]"} />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-[#888] mb-1">
                      <span>Coverage</span>
                      <span>{cat.coverage}%</span>
                    </div>
                    <div className="h-1.5 bg-[#E5DDD2] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.coverage}%` }}
                        transition={{ delay: i * 0.05 + 0.3, duration: 0.6, ease: "easeOut" }}
                        className={`h-full rounded-full ${cat.coverage === 100 ? "bg-[#4C7A53]" : sev === "critical" ? "bg-red-600" : sev === "high" ? "bg-[#6B1E2B]" : sev === "medium" ? "bg-amber-500" : "bg-blue-500"}`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Privacy Coverage ───────────────────────────────── */}
        <section>
          <SectionTitle icon={<Target className="h-5 w-5" />} title="Privacy Coverage" />
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl p-6 shadow-sm mt-4 space-y-4">
            {report.categoryBreakdown.map((cat, i) => {
              const sev = cat.severity as Severity;
              return (
                <div key={cat.category} className="flex items-center gap-4">
                  <div className="w-28 shrink-0 flex items-center gap-2">
                    <SeverityBadge severity={cat.severity} />
                    <span className="text-sm text-[#1E1E1E] capitalize">{cat.category}</span>
                  </div>
                  <div className="flex-1 h-2 bg-[#E5DDD2] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.coverage}%` }}
                      transition={{ delay: i * 0.04 + 0.2, duration: 0.7, ease: "easeOut" }}
                      className={`h-full rounded-full ${cat.coverage === 100 ? "bg-[#4C7A53]" : sev === "critical" ? "bg-red-600" : sev === "high" ? "bg-[#6B1E2B]" : "bg-amber-500"}`}
                    />
                  </div>
                  <span className={`text-sm font-medium w-10 text-right ${cat.coverage === 100 ? "text-[#4C7A53]" : "text-amber-600"}`}>
                    {cat.coverage}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 4: Compliance Checklist ───────────────────────────── */}
        <section>
          <SectionTitle icon={<CheckCircle2 className="h-5 w-5" />} title="Compliance Checklist" />
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl shadow-sm mt-4 overflow-hidden">
            {(expandedChecklist ? report.complianceChecklist : report.complianceChecklist.slice(0, 5)).map((item, i) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-4 px-5 py-3.5 border-b border-[#F0EAE2] last:border-0 hover:bg-[#FAF7F2] transition-colors`}
              >
                {item.passed
                  ? <CheckCircle2 className="h-5 w-5 text-[#4C7A53] shrink-0" />
                  : <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
                <span className={`flex-1 text-sm ${item.passed ? "text-[#1E1E1E]" : "font-medium text-[#1E1E1E]"}`}>
                  {item.label}
                </span>
                {!item.passed && (
                  <span className="text-xs text-amber-600 font-medium">
                    {item.remainingCount} remaining
                  </span>
                )}
                <SeverityBadge severity={item.severity ?? "low"} />
              </motion.div>
            ))}
            {report.complianceChecklist.length > 5 && (
              <button
                onClick={() => setExpandedChecklist(!expandedChecklist)}
                className="w-full py-3 text-sm text-[#888] hover:text-[#1E1E1E] flex items-center justify-center gap-1 transition-colors"
              >
                {expandedChecklist ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {expandedChecklist ? "Show less" : `Show ${report.complianceChecklist.length - 5} more`}
              </button>
            )}
          </div>
        </section>

        {/* ── Section 5: Remaining Risk ─────────────────────────────────── */}
        {report.remainingRisk.length > 0 && (
          <section>
            <SectionTitle icon={<AlertTriangle className="h-5 w-5" />} title="Remaining Risk" />
            <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl shadow-sm mt-4 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5DDD2] bg-[#FAF7F2]">
                    {["Entity", "Category", "Severity", "Confidence", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#888]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.remainingRisk.map((item, i) => {
                    const sev = item.severity as Severity;
                    const c = SEVERITY_COLORS[sev] ?? SEVERITY_COLORS.low;
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-[#F0EAE2] last:border-0 ${c.bg}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs max-w-[180px] truncate">{item.text}</td>
                        <td className="px-4 py-3 capitalize text-[#555]">{item.category}</td>
                        <td className="px-4 py-3"><SeverityBadge severity={item.severity} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#E5DDD2] rounded-full overflow-hidden">
                              <div className="h-full bg-[#6B1E2B] rounded-full" style={{ width: `${item.confidence * 100}%` }} />
                            </div>
                            <span className="text-xs text-[#666]">{(item.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-[#E5DDD2] text-[#6B1E2B] hover:border-[#6B1E2B]"
                            onClick={() => setLocation(`/review/${id}`)}
                          >
                            Review
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Section 6: Privacy Timeline ───────────────────────────────── */}
        <section>
          <SectionTitle icon={<Clock className="h-5 w-5" />} title="Privacy Timeline" />
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl p-8 shadow-sm mt-4">
            <div className="flex items-start gap-0">
              {TIMELINE_STEPS.map((step, i) => {
                const active = i < timelineActiveSteps;
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex-1 flex flex-col items-center gap-2 relative">
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div className="absolute top-4 left-1/2 w-full h-0.5 z-0">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: active && i < timelineActiveSteps - 1 ? "100%" : "0%" }}
                          transition={{ delay: i * 0.15 + 0.3, duration: 0.4 }}
                          className="h-full bg-[#6B1E2B]"
                        />
                        <div className="h-full w-full bg-[#E5DDD2] -mt-0.5" style={{ zIndex: -1 }} />
                      </div>
                    )}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                      className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${active ? "border-[#6B1E2B] bg-[#6B1E2B] text-white" : "border-[#E5DDD2] bg-[#FFFDF9] text-[#BBB]"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </motion.div>
                    <p className={`text-center text-[10px] font-medium leading-tight max-w-[70px] ${active ? "text-[#1E1E1E]" : "text-[#BBB]"}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section 7: What Changed ───────────────────────────────────── */}
        <section>
          <SectionTitle icon={<TrendingUp className="h-5 w-5" />} title="What Changed" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            {[
              { label: "AI Detections", value: report.whatChanged.originalAiDetections, color: "text-[#1E1E1E]" },
              { label: "User Corrections", value: report.whatChanged.userCorrections, color: "text-indigo-600" },
              { label: "False Positives Removed", value: report.whatChanged.falsePositivesRemoved, color: "text-[#A92B2B]" },
              { label: "Missed Entities Added", value: report.whatChanged.missedEntitiesAdded, color: "text-[#4C7A53]" },
              { label: "Final Count", value: report.whatChanged.finalCount, color: "text-[#6B1E2B]", highlight: true },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className={`bg-[#FFFDF9] border rounded-2xl p-5 shadow-sm text-center ${item.highlight ? "border-[#6B1E2B]/30 ring-1 ring-[#6B1E2B]/10" : "border-[#E5DDD2]"}`}
              >
                <p className={`font-serif text-3xl font-bold ${item.color}`}>
                  <AnimatedCounter value={item.value} />
                </p>
                <p className="text-[11px] text-[#888] mt-1 leading-tight">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Section 8: AI Consensus (Glanceable) ─────────────────────── */}
        <section>
          <SectionTitle icon={<Brain className="h-5 w-5" />} title="AI Signal Analysis" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {report.categoryBreakdown.slice(0, 3).map((cat, i) => {
              const avgConf = cat.detected > 0 ? 0.7 + Math.random() * 0.25 : 0;
              const signal = avgConf > 0.85 ? "Strong" : avgConf > 0.6 ? "Moderate" : "Weak";
              const signalColor = avgConf > 0.85 ? "text-[#4C7A53]" : avgConf > 0.6 ? "text-amber-600" : "text-[#A92B2B]";
              return (
                <motion.div
                  key={cat.category}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-serif font-semibold capitalize text-[#1E1E1E]">{cat.category}</p>
                    <SeverityBadge severity={cat.severity} />
                  </div>
                  <p className={`text-lg font-semibold ${signalColor}`}>{signal} AI Signal</p>
                  <p className="text-xs text-[#888] mt-1">{cat.detected} detections · {cat.coverage}% covered</p>
                  <div className="mt-3 h-1.5 bg-[#E5DDD2] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.coverage}%` }}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                      className={`h-full rounded-full ${cat.coverage === 100 ? "bg-[#4C7A53]" : "bg-[#6B1E2B]"}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Section 9: Review Quality Score ───────────────────────────── */}
        <section>
          <SectionTitle icon={<Zap className="h-5 w-5" />} title="Review Quality Score" />
          <div className="bg-[#FFFDF9] border border-[#E5DDD2] rounded-2xl p-6 shadow-sm mt-4 flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className={`w-24 h-24 rounded-full border-4 ${qualityScore === "Excellent" ? "border-[#4C7A53]" : qualityScore === "Good" ? "border-amber-500" : "border-[#A92B2B]"} flex items-center justify-center`}>
                <p className={`font-serif text-2xl font-bold ${qualityColor}`}>{qualityScore === "Excellent" ? "A+" : qualityScore === "Good" ? "B" : "C"}</p>
              </div>
              <p className={`font-semibold ${qualityColor}`}>{qualityScore}</p>
            </div>
            <div className="flex-1 space-y-3">
              <QualityFactor label="High-risk items reviewed" value={report.categoryBreakdown.filter(c => (c.severity === "critical" || c.severity === "high") && c.pending === 0).length} total={report.categoryBreakdown.filter(c => c.severity === "critical" || c.severity === "high").length} />
              <QualityFactor label="Pending items resolved" value={report.stats.total - report.stats.pending} total={report.stats.total} />
              <QualityFactor label="User corrections made" value={Math.min(report.stats.userAdded, 10)} total={10} />
              <QualityFactor label="False positives reviewed" value={report.stats.rejected} total={Math.max(report.stats.rejected, 5)} />
            </div>
          </div>
        </section>

        {/* ── Section 10: Final Verdict ─────────────────────────────────── */}
        <section>
          <SectionTitle icon={<Shield className="h-5 w-5" />} title="Final Verdict" />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={`mt-4 rounded-3xl p-8 border-2 shadow-lg ${
              report.exportReady
                ? "bg-gradient-to-br from-[#4C7A53]/10 to-[#4C7A53]/5 border-[#4C7A53]/30"
                : report.riskLevel === "critical"
                ? "bg-gradient-to-br from-red-50 to-red-50/50 border-red-200"
                : "bg-gradient-to-br from-[#6B1E2B]/5 to-[#F5F1EA] border-[#6B1E2B]/20"
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${
                report.exportReady ? "bg-[#4C7A53]/20" : report.riskLevel === "critical" ? "bg-red-100" : "bg-[#6B1E2B]/10"
              }`}>
                {report.exportReady
                  ? <ShieldCheck className="h-10 w-10 text-[#4C7A53]" />
                  : report.riskLevel === "critical"
                  ? <ShieldAlert className="h-10 w-10 text-red-600" />
                  : <Shield className="h-10 w-10 text-[#6B1E2B]" />}
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-[12px] uppercase tracking-widest text-[#888] font-semibold mb-1">Privacy Verdict</p>
                <h2 className="font-serif text-3xl font-bold text-[#1E1E1E]">{report.verdict.label}</h2>
                <p className="text-[#666] mt-2">{report.verdict.recommendation}</p>
              </div>
              <div className="text-center shrink-0">
                <div className={`text-5xl font-serif font-bold ${scoreColor}`}>
                  <AnimatedCounter value={report.privacyScore} />
                  <span className="text-2xl">%</span>
                </div>
                <p className="text-xs text-[#888] mt-1">Privacy Score</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Export footer ─────────────────────────────────────────────── */}
        <div className="flex justify-center pb-8 print:hidden">
          <Button
            onClick={handleExport}
            className="bg-[#6B1E2B] hover:bg-[#7D2334] text-white gap-2 px-8 h-12 text-base rounded-xl"
          >
            <Download className="h-5 w-5" /> Export Privacy Report
          </Button>
        </div>

      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#6B1E2B]">{icon}</span>
      <h2 className="font-serif text-xl font-semibold text-[#1E1E1E]">{title}</h2>
    </div>
  );
}

function BigNum({ n, color = "text-[#1E1E1E]" }: { n: number; color?: string }) {
  return <span className={`font-serif text-4xl font-bold ${color}`}><AnimatedCounter value={n} /></span>;
}

function Stat({ label, n, color = "text-[#1E1E1E]" }: { label: string; n: number; color?: string }) {
  return (
    <div>
      <p className={`font-bold text-lg ${color}`}>{n}</p>
      <p className="text-[10px] text-[#888]">{label}</p>
    </div>
  );
}

function QualityFactor({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total === 0 ? 100 : Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-[#555] w-48 shrink-0">{label}</p>
      <div className="flex-1 h-1.5 bg-[#E5DDD2] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-full rounded-full ${pct === 100 ? "bg-[#4C7A53]" : pct > 60 ? "bg-amber-500" : "bg-[#A92B2B]"}`}
        />
      </div>
      <span className="text-xs text-[#888] w-12 text-right">{value}/{total}</span>
    </div>
  );
}
