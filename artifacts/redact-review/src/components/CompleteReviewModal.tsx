import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertTriangle, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompleteReviewModalProps {
  open: boolean;
  pendingCount: number;
  confirmedCount: number;
  isCompleting: boolean;
  onClose: () => void;
  onProceedToFinalScan: () => void;
  onSkipAndExport: () => void;
}

export function CompleteReviewModal({
  open,
  pendingCount,
  confirmedCount,
  isCompleting,
  onClose,
  onProceedToFinalScan,
  onSkipAndExport,
}: CompleteReviewModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[500px] bg-[#FFFDF9] rounded-3xl shadow-2xl border border-[#E8DED1] p-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#aaa] hover:text-[#555] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-[#6B1E2B]/10 flex items-center justify-center shadow-inner">
                <ShieldCheck className="h-8 w-8 text-[#6B1E2B]" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl font-semibold text-[#1F1F1F] mb-2">
                Complete Review
              </h2>
              <p className="text-[#666] text-sm leading-relaxed">
                Before exporting, run a <strong>Final Safety Scan</strong> using all 3 AI engines
                to catch anything that may have been missed.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-[#F5F1EA] rounded-2xl px-4 py-3 text-center">
                <div className="font-serif text-2xl font-bold text-[#4C7A53]">{confirmedCount}</div>
                <div className="text-[11px] text-[#888] mt-0.5">Redactions Confirmed</div>
              </div>
              <div className={`rounded-2xl px-4 py-3 text-center ${pendingCount > 0 ? "bg-amber-50" : "bg-[#F5F1EA]"}`}>
                <div className={`font-serif text-2xl font-bold ${pendingCount > 0 ? "text-amber-600" : "text-[#888]"}`}>{pendingCount}</div>
                <div className="text-[11px] text-[#888] mt-0.5">Still Pending</div>
              </div>
            </div>

            {/* Pending warning */}
            {pendingCount > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  <strong>{pendingCount} items</strong> haven't been reviewed yet. The final scan will
                  flag any critical PII that was not addressed.
                </p>
              </div>
            )}

            {/* Engines list */}
            <div className="bg-[#F5F1EA] rounded-2xl p-4 mb-6">
              <p className="text-[10px] uppercase tracking-widest text-[#888] font-semibold mb-3">Final Scan Engines</p>
              <div className="space-y-2">
                {[
                  { name: "Gemini 2.5 Flash", org: "Google DeepMind" },
                  { name: "Llama 3.3 70B", org: "Groq" },
                  { name: "Claude 3 Haiku", org: "OpenRouter" },
                ].map(e => (
                  <div key={e.name} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#6B1E2B] shrink-0" />
                    <span className="text-[12px] text-[#1F1F1F] font-medium">{e.name}</span>
                    <span className="text-[10px] text-[#aaa] ml-auto">{e.org}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-[#6B1E2B] hover:bg-[#7D2334] text-white h-12 rounded-xl text-sm font-semibold shadow-sm"
                onClick={onProceedToFinalScan}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Review...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Proceed to Final Scan
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-[#888] hover:text-[#1F1F1F] h-10 rounded-xl text-sm"
                onClick={onSkipAndExport}
                disabled={isCompleting}
              >
                <FileText className="h-4 w-4 mr-2" />
                Skip Scan & Export Anyway
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
