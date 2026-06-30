import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { getSeverity, parseConsensus, isSecondOpinion, isAIDisagreement } from "@/lib/review-utils";

interface RemainingRiskBannerProps {
  redactions: any[];
  onJump: (id: string) => void;
}

export function RemainingRiskBanner({ redactions, onJump }: RemainingRiskBannerProps) {
  const pending = redactions.filter(r => r.status === "pending");
  
  const critical = pending.filter(r => getSeverity(r.category) === "critical");
  const secondOpinions = pending.filter(r => {
    const c = parseConsensus(r.note);
    return isSecondOpinion(c);
  });
  const disagreements = pending.filter(r => {
    const c = parseConsensus(r.note);
    return isAIDisagreement(c) && !isSecondOpinion(c);
  });

  const risks = [
    ...critical.map(r => ({ id: r.id, label: `Critical: ${r.category} "${r.text.slice(0, 20)}${r.text.length > 20 ? "…" : ""}"`, severity: "critical" as const })),
    ...secondOpinions.map(r => ({ id: r.id, label: `Second Opinion: "${r.text.slice(0, 20)}${r.text.length > 20 ? "…" : ""}"`, severity: "high" as const })),
    ...disagreements.slice(0, 2).map(r => ({ id: r.id, label: `AI Disagreement: ${r.category}`, severity: "medium" as const })),
  ].slice(0, 4);

  if (risks.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="shrink-0 bg-[#FFF8F0] border-b border-orange-200 px-4 py-2"
      >
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <span className="text-[11px] text-orange-700 font-semibold shrink-0">Remaining Risks:</span>
          <div className="flex items-center gap-2 flex-nowrap">
            {risks.map(risk => (
              <button
                key={risk.id}
                onClick={() => onJump(risk.id)}
                className="flex items-center gap-1 text-[11px] text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
              >
                {risk.label}
                <ChevronRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
