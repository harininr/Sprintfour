import { motion } from "framer-motion";
import { getSeverity, SEVERITY_COLORS, SEVERITY_ORDER } from "@/lib/review-utils";

interface RiskHeatmapProps {
  redactions: any[];
  onJump: (redactionId: string) => void;
}

const SEGMENT_COUNT = 20;

export function RiskHeatmap({ redactions, onJump }: RiskHeatmapProps) {
  if (redactions.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-[#888888] font-medium">Document Risk Map</span>
        <div className="h-6 rounded-md bg-emerald-100 flex items-center justify-center">
          <span className="text-[10px] text-emerald-600">Clean</span>
        </div>
      </div>
    );
  }

  // Group redactions by approximate position in document (assuming 1000-char segments)
  const maxOffset = Math.max(...redactions.map(r => r.endOffset), 1);

  const segments: (any | null)[] = Array(SEGMENT_COUNT).fill(null);

  redactions.forEach(r => {
    const segIdx = Math.min(SEGMENT_COUNT - 1, Math.floor((r.startOffset / maxOffset) * SEGMENT_COUNT));
    const existing = segments[segIdx];
    const sev = getSeverity(r.category);
    if (!existing || SEVERITY_ORDER[sev] < SEVERITY_ORDER[getSeverity(existing.category)]) {
      segments[segIdx] = r;
    }
  });

  const getSegColor = (r: any | null) => {
    if (!r) return "bg-emerald-100";
    if (r.status === "confirmed") return "bg-[#4C7A53]";
    if (r.status === "rejected") return "bg-gray-300";
    const sev = getSeverity(r.category);
    return SEVERITY_COLORS[sev].dot;
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-[#888888] font-medium">Risk Map</span>
        <span className="text-[10px] text-[#aaa]">Click to jump</span>
      </div>
      <div className="flex gap-0.5 h-5 rounded-lg overflow-hidden">
        {segments.map((seg, i) => (
          <motion.div
            key={i}
            className={`flex-1 cursor-pointer transition-all hover:opacity-70 ${getSegColor(seg)}`}
            onClick={() => seg && onJump(seg.id)}
            whileHover={{ scaleY: 1.2 }}
            title={seg ? `${seg.category} (${getSeverity(seg.category)})` : "Clean"}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { color: "bg-red-500", label: "Critical" },
          { color: "bg-orange-400", label: "High" },
          { color: "bg-amber-400", label: "Medium" },
          { color: "bg-gray-300", label: "Resolved" },
          { color: "bg-emerald-100", label: "Safe" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-[9px] text-[#888]">
            <span className={`h-2 w-2 rounded-sm ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
