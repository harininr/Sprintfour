import { motion } from "framer-motion";
import { parseConsensus, buildExplanation, extractContext, getSeverity, SEVERITY_COLORS, isSecondOpinion } from "@/lib/review-utils";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { SeverityBadge } from "./SeverityBadge";
import { X, Info, Bot, AlertTriangle, ChevronRight, ScanSearch, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RedactionInputCategory } from "@workspace/api-client-react";
import { toast } from "sonner";

const MODEL_NAMES = ["Review Engine 1 (Gemini)", "Review Engine 2 (Groq)", "Review Engine 3 (OpenRouter)"] as const;
const MODEL_KEYS = ["gemini", "groq", "openrouter"] as const;
const MODEL_SHORT = ["Gemini", "Groq", "OpenRouter"] as const;

interface EntityDetailPanelProps {
  redaction: any;
  documentContent: string;
  allRedactions: any[];
  onClose: () => void;
  onCategoryChange: (id: string, category: string) => void;
  onConfirmAll?: (ids: string[]) => void;
  onRejectAll?: (ids: string[]) => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onIgnore: (id: string) => void;
}

export function EntityDetailPanel({
  redaction: r, documentContent, allRedactions, onClose, onCategoryChange,
  onConfirmAll, onRejectAll, onConfirm, onReject, onIgnore,
}: EntityDetailPanelProps) {
  const consensus = parseConsensus(r.note);
  const explanation = buildExplanation(r, consensus);
  const { before, after } = extractContext(documentContent, r.startOffset, r.endOffset, 180);
  const sev = getSeverity(r.category);
  const sevColors = SEVERITY_COLORS[sev];
  const models = consensus?.models ?? {};
  const isSecond = isSecondOpinion(consensus);
  const hasDisagreement = consensus && consensus.count > 0 && consensus.count < 3;

  // Similar instances
  const similar = allRedactions.filter(x => x.text === r.text && x.id !== r.id && x.status === "pending");

  // Per-model "perspective" labels — read from actual consensus
  const perspectives = MODEL_KEYS.map((key, i) => {
    const detected = !!(models as any)[key];
    return { name: MODEL_NAMES[i], short: MODEL_SHORT[i], detected };
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-0 bg-[#FFFDF9] z-20 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className={`shrink-0 px-4 py-3 border-b ${isSecond ? "bg-orange-50 border-orange-200" : "bg-[#FFFDF9] border-[#E8DED1]"}`}>
        {isSecond && (
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Second Opinion Required</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl font-semibold text-[#1F1F1F] leading-tight break-words">{r.text}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <SeverityBadge category={r.category} />
              <span className="text-[10px] text-[#888] uppercase tracking-wider capitalize">{r.category}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 mt-0.5" onClick={onClose}>
            <X className="h-4 w-4 text-[#888]" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Context Preview */}
        <div className="px-4 py-3 border-b border-[#E8DED1]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] uppercase tracking-widest text-[#888] font-semibold">Context Preview</span>
          </div>
          <div className="rounded-lg border border-[#E8DED1] bg-[#F5F1EA] px-3 py-2.5 font-serif text-[12px] leading-relaxed text-[#555] italic">
            {before && <span>…{before.trimStart()}</span>}
            <span className="not-italic font-bold text-[#6B1E2B] bg-[#6B1E2B]/10 px-1 rounded mx-0.5 non-italic">{r.text}</span>
            {after && <span>{after.trimEnd()}…</span>}
          </div>
        </div>

        {/* Confidence */}
        {r.source === "ai" && (
          <div className="px-4 py-3 border-b border-[#E8DED1]">
            <span className="text-[9px] uppercase tracking-widest text-[#888] font-semibold block mb-2">AI Confidence</span>
            <ConfidenceMeter value={r.confidence ?? 0.5} showLabel />
          </div>
        )}

        {/* Review Perspectives (AI Debate) */}
        {consensus && (
          <div className="px-4 py-3 border-b border-[#E8DED1]">
            <span className="text-[9px] uppercase tracking-widest text-[#888] font-semibold block mb-2.5">Review Perspectives</span>
            <div className="space-y-2">
              {perspectives.map(({ name, detected }, i) => (
                <div
                  key={name}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs ${
                    detected
                      ? "bg-white border-[#E8DED1] text-[#1F1F1F]"
                      : "bg-[#F5F1EA] border-[#E8DED1] text-[#999]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${detected ? "bg-emerald-400" : "bg-[#ccc]"}`} />
                    <span className="font-medium text-[11px]">{name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                    detected
                      ? "bg-[#6B1E2B] text-white"
                      : "bg-[#E8DED1] text-[#888]"
                  }`}>
                    {detected ? "Redact" : "Ignore"}
                  </span>
                </div>
              ))}
            </div>

            {/* Conflict Logic box */}
            {hasDisagreement && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Conflict Logic</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Majority consensus ({consensus.count}/3) suggests redaction.
                  {consensus.message ? ` ${consensus.message}` : " Human override required to resolve."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Why Am I Seeing This */}
        <div className="px-4 py-3 border-b border-[#E8DED1]">
          <div className="flex items-center gap-1.5 mb-2">
            <Info className="h-3.5 w-3.5 text-[#6B1E2B]" />
            <span className="text-[9px] uppercase tracking-widest text-[#888] font-semibold">Why am I seeing this?</span>
          </div>
          <ul className="space-y-1.5">
            {explanation.map((line, i) => (
              <li key={i} className="text-[11px] text-[#555] flex items-start gap-2">
                <span className="h-1 w-1 rounded-full bg-[#6B1E2B] mt-1.5 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Edit Category */}
        <div className="px-4 py-3 border-b border-[#E8DED1]">
          <span className="text-[9px] uppercase tracking-widest text-[#888] font-semibold block mb-2">Adjust Category</span>
          <Select defaultValue={r.category} onValueChange={(v) => onCategoryChange(r.id, v)}>
            <SelectTrigger className="h-8 text-xs border-[#E8DED1] bg-white w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(RedactionInputCategory).map(cat => (
                <SelectItem key={cat} value={cat} className="text-xs capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Global Instances */}
        {similar.length > 0 && (
          <div className="px-4 py-3 border-b border-[#E8DED1]">
            <div className="flex items-center gap-2 mb-2.5">
              <ScanSearch className="h-3.5 w-3.5 text-[#6B1E2B]" />
              <span className="text-[9px] uppercase tracking-widest text-[#888] font-semibold">
                {similar.length} More Global Instance{similar.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[11px] text-[#666] mb-3">
              This exact text appears <strong>{similar.length + 1}</strong> times in the document. Apply same decision to all?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-[#4C7A53] hover:bg-[#3d6343] text-white text-xs h-7"
                onClick={() => {
                  onConfirmAll?.([r.id, ...similar.map(s => s.id)]);
                  toast.success(`Redacted all ${similar.length + 1} instances`);
                }}
              >
                <Check className="h-3 w-3 mr-1" /> Redact All
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-[#E8DED1] text-[#666] hover:border-red-300 hover:text-red-600 text-xs h-7"
                onClick={() => {
                  onRejectAll?.([r.id, ...similar.map(s => s.id)]);
                  toast.success(`Ignored all ${similar.length + 1} instances`);
                }}
              >
                <X className="h-3 w-3 mr-1" /> Ignore All
              </Button>
            </div>
            <button
              className="w-full mt-2 text-[10px] text-[#6B1E2B] hover:underline flex items-center justify-center gap-1"
              onClick={() => toast.info(`${similar.length} other instances in queue`)}
            >
              <ScanSearch className="h-3 w-3" />
              Scan all {similar.length + 1} global instances
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar — primary action */}
      {r.status === "pending" && (
        <div className="shrink-0 px-4 py-3 border-t border-[#E8DED1] bg-[#FFFDF9] space-y-2">
          <Button
            className="w-full bg-[#6B1E2B] hover:bg-[#7D2334] text-white font-semibold h-11 text-sm"
            onClick={() => { onConfirm(r.id); onClose(); }}
          >
            Redact Entity
            <kbd className="ml-2 font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded">[R]</kbd>
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-[#E8DED1] text-[#555] hover:border-[#6B1E2B] text-xs h-8"
              onClick={() => { onIgnore(r.id); onClose(); }}
            >
              Ignore
              <kbd className="ml-1.5 font-mono text-[9px] bg-[#F5F1EA] px-1 rounded">[I]</kbd>
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[#E8DED1] text-[#555] hover:border-amber-400 text-xs h-8"
              onClick={() => { onReject(r.id); onClose(); }}
            >
              Adjust
              <kbd className="ml-1.5 font-mono text-[9px] bg-[#F5F1EA] px-1 rounded">[A]</kbd>
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
