import { motion } from "framer-motion";

interface ConfidenceMeterProps {
  value: number; // 0-1
  showLabel?: boolean;
}

export function ConfidenceMeter({ value, showLabel = true }: ConfidenceMeterProps) {
  const pct = Math.round(value * 100);
  const label = pct >= 80 ? "High" : pct >= 50 ? "Medium" : "Low";
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  const textColor = pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-[#E8DED1] overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <span className={`text-[10px] font-semibold uppercase tracking-wide ${textColor} w-12 text-right shrink-0`}>
          {label}
        </span>
      )}
    </div>
  );
}
