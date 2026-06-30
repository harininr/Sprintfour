// ─── Severity Engine ─────────────────────────────────────────────────────────
export type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_MAP: Record<string, Severity> = {
  // Critical — direct identity theft / financial fraud risk
  ssn:          "critical",  // Aadhaar, SSN, National ID, Passport number
  financial:    "critical",  // PAN card, bank account, credit card
  medical:      "critical",  // health records, diagnoses
  phone:        "critical",  // phone numbers (direct contact / 2FA bypass)
  dob:          "critical",  // date of birth (identity verification)
  // High — significant privacy risk
  address:      "high",
  email:        "high",
  // Medium
  name:         "medium",
  other:        "medium",
  // Low
  organization: "low",
};

export function getSeverity(category: string): Severity {
  return SEVERITY_MAP[category?.toLowerCase()] ?? "medium";
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  high:     { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  medium:   { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  low:      { bg: "bg-[#F5F1EA]", text: "text-[#666666]", border: "border-[#E8DED1]", dot: "bg-gray-400" },
};

// ─── Consensus Data Parser ────────────────────────────────────────────────────
export interface ConsensusData {
  count: number;   // number of models that detected it
  message?: string;
  models?: { gemini?: boolean; groq?: boolean; openrouter?: boolean };
}

export function parseConsensus(note: string | null | undefined): ConsensusData | null {
  if (!note) return null;
  try {
    const data = JSON.parse(note);
    if (typeof data?.count === "number") return data as ConsensusData;
    return null;
  } catch {
    return null;
  }
}

export function isSecondOpinion(consensus: ConsensusData | null): boolean {
  return consensus !== null && consensus.count === 1;
}

export function isAIDisagreement(consensus: ConsensusData | null): boolean {
  return consensus !== null && consensus.count > 0 && consensus.count < 3;
}

// ─── Privacy Readiness Score ──────────────────────────────────────────────────
export function calcPrivacyReadiness(redactions: any[]): number {
  if (redactions.length === 0) return 100;
  const pending = redactions.filter(r => r.status === "pending");
  const critical = redactions.filter(r => getSeverity(r.category) === "critical" && r.status === "pending");
  const secondOpinions = redactions.filter(r => {
    const c = parseConsensus(r.note);
    return isSecondOpinion(c) && r.status === "pending";
  });

  let score = 100;
  score -= (pending.length / redactions.length) * 40;
  score -= (critical.length / (redactions.length || 1)) * 30;
  score -= (secondOpinions.length / (redactions.length || 1)) * 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Review Quality Score ─────────────────────────────────────────────────────
export function calcReviewQuality(redactions: any[], actions: any[]): { label: string; score: number; color: string } {
  if (actions.length === 0) return { label: "Not Started", score: 0, color: "text-gray-400" };
  const reviewed = redactions.filter(r => r.status !== "pending");
  const criticalReviewed = reviewed.filter(r => getSeverity(r.category) === "critical");
  const totalCritical = redactions.filter(r => getSeverity(r.category) === "critical");
  const criticalRatio = totalCritical.length > 0 ? criticalReviewed.length / totalCritical.length : 1;
  const overallRatio = redactions.length > 0 ? reviewed.length / redactions.length : 0;
  const score = Math.round((criticalRatio * 0.6 + overallRatio * 0.4) * 100);

  if (score >= 80) return { label: "Excellent", score, color: "text-[#4C7A53]" };
  if (score >= 50) return { label: "Good", score, color: "text-amber-600" };
  return { label: "Needs Attention", score, color: "text-red-600" };
}

// ─── Sorting for Dynamic Review Queue ────────────────────────────────────────
export function sortReviewQueue(redactions: any[]): any[] {
  return [...redactions].sort((a, b) => {
    const ca = parseConsensus(a.note);
    const cb = parseConsensus(b.note);
    const secondOpA = isSecondOpinion(ca) ? 0 : 1;
    const secondOpB = isSecondOpinion(cb) ? 0 : 1;
    const sevA = SEVERITY_ORDER[getSeverity(a.category)];
    const sevB = SEVERITY_ORDER[getSeverity(b.category)];

    // Critical first
    if (sevA !== sevB) return sevA - sevB;
    // Second opinion next
    if (secondOpA !== secondOpB) return secondOpA - secondOpB;
    // Disagreement next
    const disA = isAIDisagreement(ca) ? 0 : 1;
    const disB = isAIDisagreement(cb) ? 0 : 1;
    if (disA !== disB) return disA - disB;
    return 0;
  });
}

// ─── Context Extractor ────────────────────────────────────────────────────────
export function extractContext(content: string, startOffset: number, endOffset: number, chars = 200): { before: string; after: string } {
  const before = content.slice(Math.max(0, startOffset - chars), startOffset);
  const after  = content.slice(endOffset, Math.min(content.length, endOffset + chars));
  return { before, after };
}

// ─── AI Explanation Generator ─────────────────────────────────────────────────
export function buildExplanation(r: any, consensus: ConsensusData | null): string[] {
  const lines: string[] = [];
  const cat = r.category?.toLowerCase() ?? "entity";

  if (r.source === "ai") {
    if (consensus) {
      const names = [];
      if (consensus.models?.gemini) names.push("Gemini");
      if (consensus.models?.groq) names.push("Groq");
      if (consensus.models?.openrouter) names.push("OpenRouter");
      if (names.length) lines.push(`Detected by: ${names.join(", ")}`);
      lines.push(`${consensus.count} of 3 AI models flagged this as ${cat}`);
    } else {
      lines.push(`AI detected this as ${cat}`);
    }
    const conf = Math.round((r.confidence ?? 0) * 100);
    lines.push(`Confidence: ${conf}% (${conf >= 80 ? "High" : conf >= 50 ? "Medium" : "Low"})`);
    if (cat === "phone")     lines.push("Matched phone number — Critical (enables direct contact & 2FA bypass)");
    if (cat === "email")     lines.push("Matched email address format");
    if (cat === "name")      lines.push("Detected as a person name via NER model");
    if (cat === "ssn")       lines.push("Matched government ID (Aadhaar / Passport / National ID) — CRITICAL");
    if (cat === "financial") lines.push("Matched financial identifier (PAN / bank account / card) — CRITICAL");
    if (cat === "dob")       lines.push("Matched date of birth — CRITICAL (used in identity verification)");
    if (cat === "medical")   lines.push("Matched medical/health record — CRITICAL");
    if (cat === "address")   lines.push("Matched physical address — High risk");
  } else {
    lines.push("Manually added by reviewer");
    lines.push(`Category assigned: ${cat}`);
  }
  return lines;
}
