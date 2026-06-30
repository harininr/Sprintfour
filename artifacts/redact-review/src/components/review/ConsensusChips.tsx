import { type ConsensusData } from "@/lib/review-utils";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MODEL_NAMES = ["Gemini", "Groq", "OpenRouter"] as const;
const MODEL_KEYS = ["gemini", "groq", "openrouter"] as const;

interface ConsensusChipsProps {
  consensus: ConsensusData | null;
  compact?: boolean;
}

export function ConsensusChips({ consensus, compact = false }: ConsensusChipsProps) {
  if (!consensus) {
    // Fallback: show no chip data
    return (
      <span className="text-[10px] text-[#888888] italic">No consensus data</span>
    );
  }

  const models = consensus.models ?? {};
  const agreedCount = consensus.count;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        {MODEL_NAMES.map((name, i) => {
          const key = MODEL_KEYS[i];
          const detected = !!(models as any)[key];
          return (
            <span
              key={name}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                detected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-[#F5F1EA] text-[#999999] border-[#E8DED1]"
              )}
            >
              {detected
                ? <Check className="h-2.5 w-2.5" />
                : <X className="h-2.5 w-2.5" />
              }
              {name}
            </span>
          );
        })}
      </div>
      {!compact && (
        <span className={cn(
          "text-[10px] font-semibold",
          agreedCount === 3 ? "text-emerald-600" :
          agreedCount === 2 ? "text-amber-600" :
          "text-orange-600"
        )}>
          {agreedCount} of 3 AI models agree
        </span>
      )}
    </div>
  );
}
