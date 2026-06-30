import { motion } from "framer-motion";
import { Check, Bot, User, ShieldCheck, Download } from "lucide-react";

type Stage = "detection" | "consensus" | "review" | "corrections" | "safety" | "export";

const STAGES: { key: Stage; label: string; icon: React.ReactNode }[] = [
  { key: "detection",   label: "AI Detection",  icon: <Bot className="h-3 w-3" /> },
  { key: "consensus",   label: "Consensus",      icon: <Bot className="h-3 w-3" /> },
  { key: "review",      label: "Human Review",   icon: <User className="h-3 w-3" /> },
  { key: "corrections", label: "Corrections",    icon: <Check className="h-3 w-3" /> },
  { key: "safety",      label: "Safety Scan",    icon: <ShieldCheck className="h-3 w-3" /> },
  { key: "export",      label: "Export",         icon: <Download className="h-3 w-3" /> },
];

interface ReviewTimelineProps {
  currentStage: Stage;
}

const STAGE_ORDER: Stage[] = ["detection", "consensus", "review", "corrections", "safety", "export"];

export function ReviewTimeline({ currentStage }: ReviewTimelineProps) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-[#888888] font-medium mb-1">Review Progress</span>
      <div className="flex items-center">
        {STAGES.map((stage, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors text-white ${
                    done ? "bg-[#4C7A53]" : active ? "bg-[#6B1E2B]" : "bg-[#E8DED1]"
                  }`}
                  animate={active ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
                >
                  {done
                    ? <Check className="h-2.5 w-2.5" />
                    : <span className={active ? "text-white" : "text-[#aaa]"}>{stage.icon}</span>
                  }
                </motion.div>
                <span className={`text-[8px] font-medium text-center leading-tight ${active ? "text-[#6B1E2B]" : done ? "text-[#4C7A53]" : "text-[#bbb]"}`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mb-3 mx-0.5 transition-colors ${i < currentIdx ? "bg-[#4C7A53]" : "bg-[#E8DED1]"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
