import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { getSeverity, parseConsensus, isSecondOpinion, calcPrivacyReadiness, calcReviewQuality, SEVERITY_COLORS } from "@/lib/review-utils";
import { SeverityBadge } from "./SeverityBadge";
import { RiskHeatmap } from "./RiskHeatmap";
import { ReviewTimeline } from "./ReviewTimeline";
import { ConsensusChips } from "./ConsensusChips";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { Check, X, Info, ArrowRight, Zap, ShieldCheck, Eye, AlertTriangle, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RedactionInputCategory } from "@workspace/api-client-react";

type Tab = "pending" | "confirmed" | "rejected" | "user";

interface ReviewSidebarProps {
  redactions: any[];
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onIgnore: (id: string) => void;
  onDelete: (id: string) => void;
  onShowDetail: (id: string) => void;
  onJump: (id: string) => void;
  onCategoryChange: (id: string, category: string) => void;
  actions: any[];
  pendingList: any[];
  confirmedList: any[];
  rejectedList: any[];
  userList: any[];
}

function PrivacyReadinessGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#4C7A53" : score >= 60 ? "#D88B5A" : "#A92B2B";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#E8DED1" strokeWidth="5" />
          <motion.circle
            cx="28" cy="28" r="22"
            fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - score / 100)}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - score / 100) }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="font-bold text-lg leading-none"
            style={{ color }}
            key={score}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      <span className="text-[10px] text-[#888] text-center font-medium">Privacy<br />Readiness</span>
    </div>
  );
}

export function ReviewSidebar({
  redactions, activeTab, onTabChange,
  selectedId, onSelect, onConfirm, onReject, onIgnore, onDelete, onShowDetail, onJump, onCategoryChange,
  actions, pendingList, confirmedList, rejectedList, userList,
}: ReviewSidebarProps) {
  const privacyScore = calcPrivacyReadiness(redactions);
  const reviewQuality = calcReviewQuality(redactions, actions);
  const [isScrolled, setIsScrolled] = useState(false);

  const activeList =
    activeTab === "pending" ? pendingList :
      activeTab === "confirmed" ? confirmedList :
        activeTab === "rejected" ? rejectedList : userList;

  const criticalPending = pendingList.filter(r => getSeverity(r.category) === "critical");
  const secondOpinionPending = pendingList.filter(r => isSecondOpinion(parseConsensus(r.note)));
  const disagreementsPending = pendingList.filter(r => {
    const c = parseConsensus(r.note);
    return c && c.count > 0 && c.count < 3;
  });

  // Smart decision suggestion: if user has confirmed 3+ of same category
  const lastConfirmedCategory = [...(actions || [])]
    .filter(a => a.action === "confirmed")
    .slice(-3)
    .map(a => redactions.find(r => r.id === a.redactionId)?.category)
    .filter(Boolean);
  const suggestCategory = lastConfirmedCategory.length === 3 && lastConfirmedCategory.every(c => c === lastConfirmedCategory[0])
    ? lastConfirmedCategory[0]
    : null;
  const suggestCandidates = suggestCategory
    ? pendingList.filter(r => r.category === suggestCategory)
    : [];

  // ── Render a single entity card ─────────────────────────────────────────────
  const renderEntityCard = (r: any) => {
    const consensus = parseConsensus(r.note);
    const isSecond = isSecondOpinion(consensus);
    const isDisagreement = consensus && consensus.count > 0 && consensus.count < 3 && !isSecond;
    const sev = getSeverity(r.category);
    const isActive = selectedId === r.id;

    return (
      <motion.div
        key={r.id}
        id={`redaction-${r.id}`}
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
        className={`
          bg-[#FFFDF9] border rounded-xl p-3 cursor-pointer relative overflow-hidden
          transition-all duration-150
          ${isActive ? "border-[#6B1E2B] ring-1 ring-[#6B1E2B]/20 shadow-md" : "border-[#E8DED1] hover:border-[#6B1E2B]/30 hover:shadow-sm"}
          ${isSecond ? "border-l-4 border-l-orange-400" : ""}
          ${sev === "critical" && r.status === "pending" ? "border-l-4 border-l-red-500" : ""}
        `}
        onClick={() => {
          onSelect(r.id);
          window.document.getElementById(`doc-redaction-${r.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      >
        {isSecond && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wider">
              Second Opinion — Needs Review
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-mono text-xs text-[#1F1F1F] line-clamp-2 flex-1 bg-[#F5F1EA] px-1.5 py-1 rounded-md">
            {r.text}
          </span>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <SeverityBadge category={r.category} />
            <span className="text-[9px] uppercase tracking-wider text-[#aaa]">{r.category}</span>
          </div>
        </div>

        {r.source === "ai" && (
          <div className="mb-2">
            <ConfidenceMeter value={r.confidence ?? 0.5} showLabel />
          </div>
        )}

        {/* Per-engine confidence pills */}
        {consensus && (
          <div className="mb-2">
            <ConsensusChips consensus={consensus} compact />
            <div className="mt-1.5 space-y-1">
              {(["gemini", "groq", "openrouter"] as const).map((key, i) => {
                const detected = !!(consensus.models as any)?.[key];
                const name = ["Gemini", "Groq", "OpenRouter"][i];
                const conf = detected ? 0.85 : 0.15;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`text-[9px] w-14 font-medium ${detected ? "text-[#1F1F1F]" : "text-[#bbb]"}`}>{name}</span>
                    <div className="flex-1 h-1.5 bg-[#E8DED1] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${detected ? "bg-[#6B1E2B]" : "bg-[#E8DED1]"}`}
                        style={{ width: `${conf * 100}%` }}
                      />
                    </div>
                    <span className={`text-[9px] w-7 text-right font-semibold ${detected ? "text-[#6B1E2B]" : "text-[#ccc]"}`}>
                      {Math.round(conf * 100)}%
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${detected ? "bg-[#6B1E2B] text-white" : "bg-[#E8DED1] text-[#aaa]"}`}>
                      {detected ? "↑" : "↓"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-1.5 text-right">
              <span className={`text-[9px] font-semibold ${consensus.count === 3 ? "text-emerald-600" : consensus.count >= 2 ? "text-amber-600" : "text-orange-600"}`}>
                {consensus.count}/3 engines agree
              </span>
            </div>
          </div>
        )}

        {isDisagreement && (
          <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mb-2">
            AI engines disagree. {consensus?.message}
          </div>
        )}

        {activeTab === "pending" && (
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex gap-1.5">
              <Button size="sm" className="flex-1 bg-[#4C7A53] hover:bg-[#3d6343] text-white text-xs h-7"
                onClick={e => { e.stopPropagation(); onConfirm(r.id); }}>
                <Check className="h-3 w-3 mr-1" /> Redact
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-[#E8DED1] text-[#666] hover:border-red-300 hover:text-red-600 text-xs h-7"
                onClick={e => { e.stopPropagation(); onReject(r.id); }}>
                <X className="h-3 w-3 mr-1" /> Ignore
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 text-[#888] hover:text-[#6B1E2B]"
                title="Details & Debate"
                onClick={e => { e.stopPropagation(); onShowDetail(r.id); }}>
                <Info className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="w-full text-[10px] h-6 text-[#aaa] hover:text-[#666]"
              onClick={e => { e.stopPropagation(); onIgnore(r.id); }}>
              Ignore & Skip
            </Button>
          </div>
        )}

        {activeTab !== "pending" && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8DED1] text-xs text-[#888]">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{r.status === "confirmed" ? "Redacted" : r.status === "rejected" ? "Ignored" : "User Added"}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-[#ccc] hover:text-red-400"
              onClick={e => { e.stopPropagation(); onDelete(r.id); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <aside className="w-full h-full bg-[#FAF7F2] border-l border-[#E8DED1] flex flex-col relative z-20 shadow-xl overflow-hidden shrink-0">
      <AnimatePresence initial={false}>
        {!isScrolled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden flex flex-col"
          >
            {/* Top Fixed Area */}
            <div className="shrink-0 px-4 py-3 border-b border-[#E8DED1] bg-[#F5F1EA]/60">
              <div className="flex items-center justify-between">
                <PrivacyReadinessGauge score={privacyScore} />
                <div className="flex flex-col gap-2 flex-1 pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#888] uppercase tracking-wider">Review Quality</span>
                    <span className={`text-[11px] font-bold ${reviewQuality.color}`}>{reviewQuality.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {criticalPending.length > 0 && (
                      <button onClick={() => criticalPending[0] && onJump(criticalPending[0].id)} className="flex flex-col items-center bg-red-50 border border-red-200 rounded-lg p-1.5 hover:bg-red-100 transition-colors">
                        <span className="text-red-700 font-bold text-sm leading-none">{criticalPending.length}</span>
                        <span className="text-[9px] text-red-500 mt-0.5">Critical</span>
                      </button>
                    )}
                    {secondOpinionPending.length > 0 && (
                      <button onClick={() => secondOpinionPending[0] && onJump(secondOpinionPending[0].id)} className="flex flex-col items-center bg-orange-50 border border-orange-200 rounded-lg p-1.5 hover:bg-orange-100 transition-colors">
                        <span className="text-orange-700 font-bold text-sm leading-none">{secondOpinionPending.length}</span>
                        <span className="text-[9px] text-orange-500 mt-0.5">2nd Opinion</span>
                      </button>
                    )}
                    {disagreementsPending.length > 0 && (
                      <button onClick={() => disagreementsPending[0] && onJump(disagreementsPending[0].id)} className="flex flex-col items-center bg-amber-50 border border-amber-200 rounded-lg p-1.5 hover:bg-amber-100 transition-colors">
                        <span className="text-amber-700 font-bold text-sm leading-none">{disagreementsPending.length}</span>
                        <span className="text-[9px] text-amber-500 mt-0.5">Disputes</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Heatmap */}
            <div className="px-4 py-3 border-b border-[#E8DED1]">
              <RiskHeatmap redactions={redactions} onJump={onJump} />
            </div>

            {/* Timeline */}
            <div className="px-4 py-3 border-b border-[#E8DED1]">
              <ReviewTimeline currentStage={
                pendingList.length > 0 ? "review" :
                  confirmedList.length > 0 || rejectedList.length > 0 ? "corrections" : "consensus"
              } />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Decision Suggestion Banner */}
      <AnimatePresence>
        {suggestCandidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="mx-3 my-2 bg-[#6B1E2B]/5 border border-[#6B1E2B]/20 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#6B1E2B]" />
                <span className="text-[11px] font-semibold text-[#6B1E2B]">Smart Suggestion</span>
              </div>
              <p className="text-[11px] text-[#555]">
                You've confirmed several <strong>{suggestCategory}</strong> entities. Apply same decision to {suggestCandidates.length} remaining?
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="h-6 text-[10px] px-2 bg-[#4C7A53] text-white hover:bg-[#3d6343]"
                  onClick={() => suggestCandidates.forEach(r => onConfirm(r.id))}>
                  Accept All
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-[#888]">
                  Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <div className="shrink-0 flex gap-1 px-2 pt-2 pb-1 border-b border-[#E8DED1]">
        {(["pending", "confirmed", "rejected", "user"] as Tab[]).map(tab => {
          const count = tab === "pending" ? pendingList.length : tab === "confirmed" ? confirmedList.length : tab === "rejected" ? rejectedList.length : userList.length;
          const labels = { pending: "Review", confirmed: "Redacted", rejected: "Ignored", user: "Added" };
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded-lg transition-all ${activeTab === tab
                  ? "bg-[#FFFDF9] border border-[#E8DED1] shadow-sm text-[#1F1F1F]"
                  : "text-[#888888] hover:bg-white/50"
                }`}
            >
              {labels[tab]}
              <span className={`ml-1 ${activeTab === tab ? "text-[#6B1E2B] font-bold" : ""}`}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Entity List */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        onScroll={(e) => setIsScrolled((e.target as HTMLDivElement).scrollTop > 20)}
      >
        <AnimatePresence>
          {activeList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#888888] py-16">
              <ShieldCheck className="h-10 w-10 opacity-25 mb-3" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs text-[#aaa] mt-1">Nothing in this queue</p>
            </div>
          ) : activeTab === "pending" ? (
            (() => {
              const PRIORITY_GROUPS = [
                { key: "critical", label: "Critical", categories: ["ssn", "financial", "medical", "phone", "dob"], color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
                { key: "high", label: "High", categories: ["address", "email"], color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500" },
                { key: "medium", label: "Medium", categories: ["name", "other"], color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400" },
                { key: "low", label: "Low", categories: ["organization"], color: "text-[#666]", bg: "bg-[#F5F1EA]", border: "border-[#E8DED1]", dot: "bg-gray-400" },
              ];
              return (
                <div className="space-y-4">
                  {PRIORITY_GROUPS.map(group => {
                    const groupItems = activeList.filter(r => group.categories.includes(r.category));
                    if (groupItems.length === 0) return null;
                    return (
                      <div key={group.key}>
                        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-2 ${group.bg} border ${group.border}`}>
                          <span className={`h-2 w-2 rounded-full ${group.dot} shrink-0`} />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${group.color}`}>{group.label}</span>
                          <span className={`text-[10px] font-bold ${group.color}`}>{groupItems.length}</span>

                          <div className="ml-auto flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className={`h-5 px-1.5 text-[9px] hover:bg-white/50 ${group.color}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                groupItems.forEach(r => onConfirm(r.id));
                                toast.success(`Redacted all ${groupItems.length} ${group.label} items`);
                              }} title={`Redact all ${group.label}`}>
                              <Check className="h-3 w-3 mr-1" /> Redact All
                            </Button>
                            <Button size="sm" variant="ghost" className={`h-5 px-1.5 text-[9px] hover:bg-white/50 text-gray-500 hover:text-gray-700`}
                              onClick={(e) => {
                                e.stopPropagation();
                                groupItems.forEach(r => onReject(r.id));
                                toast.success(`Ignored all ${groupItems.length} ${group.label} items`);
                              }} title={`Ignore all ${group.label}`}>
                              <X className="h-3 w-3 mr-1" /> Ignore All
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">{groupItems.map(r => renderEntityCard(r))}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            activeList.map(r => renderEntityCard(r))
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

