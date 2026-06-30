import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const ParamsSchema = z.object({ id: z.string().uuid() });

type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY: Record<string, Severity> = {
  ssn: "critical",
  financial: "critical",
  medical: "high",
  phone: "high",
  dob: "high",
  address: "medium",
  email: "medium",
  name: "low",
  organization: "low",
  other: "low",
};

const SEVERITY_DEDUCTION: Record<Severity, number> = {
  critical: 18,
  high: 9,
  medium: 4,
  low: 2,
};

const CHECKLIST_LABELS: Record<string, string> = {
  ssn: "All SSNs removed",
  financial: "All financial identifiers removed",
  medical: "All medical identifiers removed",
  phone: "All phone numbers removed",
  dob: "All dates of birth removed",
  address: "All addresses removed",
  email: "All email addresses removed",
  name: "All personal names removed",
  organization: "All organization names removed",
  other: "All other PII removed",
};

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

function severityOrder(s: Severity) {
  return SEVERITY_ORDER.indexOf(s);
}

router.get("/documents/:id/intelligence", async (req, res): Promise<void> => {
  const params = ParamsSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id")
    .eq("id", params.data.id)
    .single();

  if (docError || !doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const { data: rowsResult } = await supabase
    .from("redactions")
    .select("*")
    .eq("document_id", doc.id);

  const rows = rowsResult || [];

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = rows.length;
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const userAdded = rows.filter((r) => r.status === "user_added").length;
  const aiDetected = rows.filter((r) => r.source === "ai").length;

  // ── Category breakdown ─────────────────────────────────────────────────────
  const allCategories = Array.from(new Set(rows.map((r) => r.category)));
  const categoryBreakdown = allCategories
    .map((cat) => {
      const catRows = rows.filter((r) => r.category === cat);
      const catConfirmed = catRows.filter((r) => r.status === "confirmed").length;
      const catRejected = catRows.filter((r) => r.status === "rejected").length;
      const catPending = catRows.filter((r) => r.status === "pending").length;
      const catUserAdded = catRows.filter((r) => r.status === "user_added").length;
      const active = catConfirmed + catPending + catUserAdded;
      const coverage = active === 0 ? 100 : Math.round((catConfirmed + catUserAdded) / active * 100);
      return {
        category: cat,
        severity: SEVERITY[cat] ?? "low",
        detected: catRows.length,
        confirmed: catConfirmed,
        rejected: catRejected,
        pending: catPending,
        coverage,
      };
    })
    .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));

  // ── Privacy score ──────────────────────────────────────────────────────────
  let score = 100;
  const pendingRows = rows.filter((r) => r.status === "pending");
  for (const r of pendingRows) {
    const sev: Severity = SEVERITY[r.category] ?? "low";
    score -= SEVERITY_DEDUCTION[sev];
  }
  score = Math.max(0, Math.min(100, score));

  // ── Risk level ─────────────────────────────────────────────────────────────
  const criticalPending = pendingRows.filter((r) => SEVERITY[r.category] === "critical").length;
  const highPending = pendingRows.filter((r) => SEVERITY[r.category] === "high").length;
  const medPending = pendingRows.filter((r) => SEVERITY[r.category] === "medium").length;

  const riskLevel =
    criticalPending > 0 ? "critical"
    : highPending > 0 ? "high"
    : medPending > 0 ? "medium"
    : pending > 0 ? "low"
    : "safe";

  const exportReady = pending === 0;

  // ── Compliance checklist ───────────────────────────────────────────────────
  const complianceChecklist = allCategories
    .map((cat) => {
      const remaining = rows.filter(
        (r) => r.category === cat && r.status === "pending"
      ).length;
      return {
        label: CHECKLIST_LABELS[cat] ?? `All ${cat} removed`,
        passed: remaining === 0,
        category: cat,
        remainingCount: remaining,
        severity: SEVERITY[cat] ?? "low",
      };
    })
    .sort((a, b) => severityOrder(a.severity as Severity) - severityOrder(b.severity as Severity));

  // ── Remaining risk ─────────────────────────────────────────────────────────
  const remainingRisk = pendingRows
    .map((r) => ({
      id: r.id,
      text: r.text,
      category: r.category,
      severity: SEVERITY[r.category] ?? "low",
      confidence: r.confidence,
      startOffset: r.start_offset, // use snake case since it's from supabase directly
    }))
    .sort(
      (a, b) =>
        severityOrder(a.severity as Severity) - severityOrder(b.severity as Severity) ||
        b.confidence - a.confidence
    );

  // ── What changed ───────────────────────────────────────────────────────────
  const originalAiDetections = rows.filter((r) => r.source === "ai").length;
  const falsePositivesRemoved = rows.filter(
    (r) => r.source === "ai" && r.status === "rejected"
  ).length;
  const missedEntitiesAdded = rows.filter((r) => r.source === "user").length;
  const userCorrections = falsePositivesRemoved + missedEntitiesAdded;
  const finalCount = confirmed + userAdded;

  // ── Verdict ────────────────────────────────────────────────────────────────
  let verdictLabel: string;
  let recommendation: string;

  if (criticalPending > 0) {
    verdictLabel = "Needs Immediate Action";
    recommendation = `${criticalPending} critical identifier${criticalPending > 1 ? "s" : ""} remain unreviewed. Review before export.`;
  } else if (highPending > 0) {
    verdictLabel = "Needs Attention";
    recommendation = `${highPending} high-risk item${highPending > 1 ? "s" : ""} still pending. Complete review before sharing.`;
  } else if (medPending > 0) {
    verdictLabel = "Almost Ready";
    recommendation = `${medPending} medium-risk item${medPending > 1 ? "s" : ""} pending. Consider reviewing before export.`;
  } else if (pending > 0) {
    verdictLabel = "Low Risk Remaining";
    recommendation = `${pending} low-risk item${pending > 1 ? "s" : ""} remain. Document is largely safe to share.`;
  } else {
    verdictLabel = "Ready for Export";
    recommendation = "All PII has been reviewed. This document is safe to export.";
  }

  const verdict = { label: verdictLabel, score, riskLevel, recommendation };

  res.json({
    documentId: doc.id,
    privacyScore: score,
    riskLevel,
    exportReady,
    stats: { total, confirmed, rejected, pending, userAdded, aiDetected },
    categoryBreakdown,
    complianceChecklist,
    remainingRisk,
    whatChanged: {
      originalAiDetections,
      userCorrections,
      falsePositivesRemoved,
      missedEntitiesAdded,
      finalCount,
    },
    verdict,
  });
});

export default router;
