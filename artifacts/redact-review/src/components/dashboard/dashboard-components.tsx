import React from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, Activity, FileText, CheckCircle2, Clock, Upload,
  Search, Brain, TrendingUp, AlertTriangle, ChevronRight, Eye, ShieldCheck,
  Fingerprint, MessageSquareWarning, RefreshCw, BarChart3, ListTodo, Zap,
  TrendingDown, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const CARD = "bg-white border border-[#EAE4DC] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300";

export const HeroSection = ({ onUploadClick, onAuditorClick }: { onUploadClick: () => void, onAuditorClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
    className="relative overflow-hidden rounded-2xl border border-[#EAE4DC] shadow-sm"
    style={{ background: "linear-gradient(135deg, #FFFDF9 0%, #F7F2EA 60%, #EDE6DA 100%)" }}
  >
    {/* Decorative background circles */}
    <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 bg-[#6B1E2B]" style={{ transform: "translate(30%, -30%)" }} />
    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 bg-[#6B1E2B]" style={{ transform: "translate(-30%, 30%)" }} />

    <div className="relative px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex-1 space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#6B1E2B]/10 text-[#6B1E2B] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#6B1E2B]/20 mb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6B1E2B] animate-pulse" />
          AI-Powered Privacy Intelligence
        </div>
        <h1 className="font-serif text-[#1E1E1E] text-3xl md:text-4xl font-bold leading-tight">
          Redact. Review. <span className="text-[#6B1E2B]">Secure.</span>
        </h1>
        <p className="text-[#1E1E1E]/60 text-base max-w-xl leading-relaxed">
          Monitor document privacy, review AI detections, resolve risks, and prepare documents for secure sharing.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <Button
          onClick={onUploadClick}
          className="bg-[#6B1E2B] text-white hover:bg-[#7D2334] rounded-xl px-6 h-11 font-medium shadow-md hover:shadow-lg transition-all gap-2"
        >
          <Upload className="h-4 w-4" /> Upload Document
        </Button>
        <Button
          onClick={onAuditorClick}
          variant="outline"
          className="border-[#E5DDD2] text-[#1E1E1E] hover:bg-[#F5F1EA] rounded-xl px-6 h-11 font-medium gap-2"
        >
          <ShieldAlert className="h-4 w-4 text-[#6B1E2B]" /> Privacy Auditor
        </Button>
      </div>
    </div>
  </motion.div>
);

export const QuickStatistics = ({ stats }: { stats: any }) => {
  const items = [
    {
      title: "Privacy Readiness",
      value: stats.readiness + "%",
      icon: ShieldCheck,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
      bar: stats.readiness,
      barColor: "bg-emerald-500",
      trend: stats.readiness > 80 ? "up" : stats.readiness > 50 ? "neutral" : "down",
    },
    {
      title: "Overall Risk Level",
      value: stats.overallRisk,
      icon: AlertTriangle,
      color: stats.overallRisk === "Low" ? "text-emerald-600" : stats.overallRisk === "Medium" ? "text-amber-600" : "text-red-600",
      iconBg: stats.overallRisk === "Low" ? "bg-emerald-50" : stats.overallRisk === "Medium" ? "bg-amber-50" : "bg-red-50",
      bar: null,
      barColor: "",
      trend: stats.overallRisk === "Low" ? "up" : "down",
    },
    {
      title: "Docs Completed",
      value: stats.reviewed,
      icon: CheckCircle2,
      color: "text-blue-600",
      iconBg: "bg-blue-50",
      bar: null,
      barColor: "",
      trend: "up",
    },
    {
      title: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      iconBg: "bg-amber-50",
      bar: null,
      barColor: "",
      trend: stats.pending > 0 ? "down" : "up",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
          className={`${CARD} p-5 flex flex-col justify-between gap-4`}
        >
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${item.iconBg} shrink-0`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <span className={`text-xs font-medium flex items-center gap-1 ${
              item.trend === "up" ? "text-emerald-600" : item.trend === "down" ? "text-red-500" : "text-amber-500"
            }`}>
              {item.trend === "up" ? <TrendingUp className="h-3 w-3" /> : item.trend === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-[#1E1E1E] leading-none mb-1">{item.value}</div>
            <div className="text-xs text-[#1E1E1E]/50 font-medium">{item.title}</div>
            {item.bar !== null && (
              <div className="mt-3 h-1.5 w-full bg-[#F0EBE3] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${item.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.bar}%` }}
                  transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export const TrustMeter = ({ score }: { score: number }) => {
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 50 ? "Good" : "At Risk";

  return (
    <motion.div className={`${CARD} p-6 flex flex-col h-full`} whileHover={{ scale: 1.01 }}>
      <h3 className="font-serif text-[#1E1E1E] text-base font-semibold mb-5 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#6B1E2B]" /> Trust Score
      </h3>
      <div className="flex flex-col items-center flex-1 justify-center">
        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#F0EBE3" strokeWidth="9" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="9"
              strokeDasharray={264} strokeDashoffset={264 - (264 * score) / 100}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <motion.span className="font-bold text-2xl leading-none" style={{ color }} key={score} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              {score}
            </motion.span>
            <span className="text-[10px] text-[#1E1E1E]/40 uppercase tracking-widest mt-0.5">/ 100</span>
          </div>
        </div>
        <span className="text-sm font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="mt-4 space-y-2.5 border-t border-[#F0EBE3] pt-4">
        {[
          { label: "AI Agreement", val: "92%", ok: true },
          { label: "Safety Scan", val: "Passed", ok: true },
          { label: "Remaining Risk", val: score > 70 ? "Low" : "Medium", ok: score > 70 },
        ].map(r => (
          <div key={r.label} className="flex justify-between items-center text-xs">
            <span className="text-[#1E1E1E]/60">{r.label}</span>
            <span className={`font-semibold ${r.ok ? "text-emerald-600" : "text-amber-600"}`}>{r.val}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const PrivacyIntelligence = ({ summaries = [] }: { summaries?: { label: string, value: string, desc: string }[] }) => (
  <div className={`${CARD} p-6 flex-1`}>
    <h3 className="font-serif text-[#1E1E1E] text-base font-semibold mb-5 flex items-center gap-2">
      <Brain className="h-4 w-4 text-[#6B1E2B]" /> Privacy Intelligence
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {summaries?.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="bg-[#F8F4EE] rounded-xl p-4 border border-[#EAE4DC] flex flex-col gap-2"
        >
          <div className="text-xs text-[#1E1E1E]/50 font-medium uppercase tracking-wide">{s.label}</div>
          <div className="font-serif text-2xl font-bold text-[#1E1E1E]">{s.value}</div>
          <div className="text-xs text-[#6B1E2B] font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> {s.desc}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export const AIAnalytics = ({ stats = [], total = 0 }: { stats?: { name: string, count: number, color: string }[], total?: number }) => (
  <div className={`${CARD} p-6`}>
    <h3 className="font-serif text-[#1E1E1E] text-base font-semibold mb-5 flex items-center gap-2">
      <BarChart3 className="h-4 w-4 text-[#6B1E2B]" /> Confidence Analytics
    </h3>
    <div className="space-y-4">
      {stats?.map(m => (
        <div key={m.name}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-[#1E1E1E]/80">{m.name}</span>
            <span className="text-[#1E1E1E]/50">{m.count}</span>
          </div>
          <div className="h-1.5 w-full bg-[#F0EBE3] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: total > 0 ? `${(m.count / total) * 100}%` : "0%" }}
              transition={{ duration: 0.8 }}
              className={`h-full ${m.color} rounded-full`}
            />
          </div>
        </div>
      ))}
      <div className="pt-3 mt-2 border-t border-[#F0EBE3] flex justify-between items-center">
        <span className="text-xs text-[#1E1E1E]/60">Total Detections</span>
        <span className="font-serif text-xl font-bold text-[#6B1E2B]">{total}</span>
      </div>
    </div>
  </div>
);

export const PIIBreakdown = ({ pii }: { pii: { name: string, count: number }[] }) => {
  const max = Math.max(...pii.map(p => p.count), 1);
  return (
    <div className={`${CARD} p-6`}>
      <h3 className="font-serif text-[#1E1E1E] text-base font-semibold mb-5 flex items-center gap-2">
        <Fingerprint className="h-4 w-4 text-[#6B1E2B]" /> PII Breakdown
      </h3>
      {pii.length === 0 ? (
        <p className="text-sm text-[#1E1E1E]/40 text-center py-6">No PII detected yet.</p>
      ) : (
        <div className="space-y-3">
          {pii.slice(0, 8).map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-xs text-[#1E1E1E]/50 capitalize w-20 shrink-0">{p.name}</span>
              <div className="flex-1 h-2 bg-[#F0EBE3] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#6B1E2B] rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(p.count / max) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.05 }}
                />
              </div>
              <span className="text-xs font-bold text-[#1E1E1E] w-6 text-right shrink-0">{p.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SmartInsights = ({ insights }: { insights: { title: string, desc: string, priority: string }[] }) => (
  <div className={`${CARD} p-6`}>
    <h3 className="font-serif text-[#1E1E1E] text-base font-semibold mb-4 flex items-center gap-2">
      <Zap className="h-4 w-4 text-[#6B1E2B]" /> Smart Insights
    </h3>
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <motion.div
          key={i} whileHover={{ x: 3 }}
          className={`flex gap-3 items-start p-3.5 rounded-xl border transition-colors ${
            insight.priority === "high" ? "bg-red-50 border-red-100" :
            insight.priority === "medium" ? "bg-amber-50 border-amber-100" :
            "bg-blue-50 border-blue-100"
          }`}
        >
          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
            insight.priority === "high" ? "bg-red-500" :
            insight.priority === "medium" ? "bg-amber-400" : "bg-blue-400"
          }`} />
          <div>
            <div className="text-xs font-semibold text-[#1E1E1E]">{insight.title}</div>
            <div className="text-xs text-[#1E1E1E]/60 mt-0.5 leading-relaxed">{insight.desc}</div>
          </div>
        </motion.div>
      ))}
      {insights.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <ShieldCheck className="h-8 w-8 text-emerald-400 opacity-60" />
          <span className="text-xs text-[#1E1E1E]/40">All clear — no pressing insights</span>
        </div>
      )}
    </div>
  </div>
);

export const ActivityTimeline = ({ activities }: { activities: { time: string, text: string }[] }) => (
  <div className={`${CARD} p-6`}>
    <h3 className="font-serif text-[#1E1E1E] text-base font-semibold mb-5 flex items-center gap-2">
      <Clock className="h-4 w-4 text-[#6B1E2B]" /> Recent Activity
    </h3>
    <div className="relative space-y-0">
      {activities.length === 0 && (
        <p className="text-xs text-[#1E1E1E]/40 text-center py-4">No recent activity.</p>
      )}
      {activities.slice(0, 5).map((a, i) => (
        <div key={i} className="flex gap-3 pb-5 last:pb-0 relative">
          <div className="flex flex-col items-center shrink-0">
            <div className="h-2 w-2 rounded-full bg-[#6B1E2B] mt-1 shrink-0 z-10" />
            {i < activities.length - 1 && <div className="w-px flex-1 bg-[#EAE4DC] mt-1" />}
          </div>
          <div className="flex-1 min-w-0">
            <time className="text-[10px] font-semibold text-[#6B1E2B] block">{a.time}</time>
            <p className="text-xs text-[#1E1E1E]/70 mt-0.5 leading-relaxed">{a.text}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ComplianceChecklist = ({ items }: { items: { label: string, status: string }[] }) => (
  <div className={`${CARD} p-6`}>
    <h3 className="font-serif text-[#1E1E1E] text-base font-semibold mb-4 flex items-center gap-2">
      <ListTodo className="h-4 w-4 text-[#6B1E2B]" /> Compliance Checklist
    </h3>
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F8F4EE] transition-colors">
          <div className="flex items-center gap-2.5">
            <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
              item.status === "complete" ? "bg-emerald-500" :
              item.status === "review" ? "bg-amber-400" : "bg-red-400"
            }`}>
              {item.status === "complete" && <CheckCircle2 className="h-3 w-3 text-white" />}
            </div>
            <span className="text-sm text-[#1E1E1E]/80 capitalize font-medium">{item.label}</span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            item.status === "complete" ? "bg-emerald-50 text-emerald-700" :
            item.status === "review" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
          }`}>
            {item.status === "complete" ? "Done" : item.status === "review" ? "Review" : "Pending"}
          </span>
        </div>
      ))}
    </div>
  </div>
);
