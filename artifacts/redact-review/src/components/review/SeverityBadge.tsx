import { getSeverity, SEVERITY_COLORS, type Severity } from "@/lib/review-utils";
import { cn } from "@/lib/utils";

const LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function SeverityBadge({ category, className }: { category: string; className?: string }) {
  const sev = getSeverity(category);
  const colors = SEVERITY_COLORS[sev];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
        colors.bg, colors.text, colors.border, className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {LABELS[sev]}
    </span>
  );
}
