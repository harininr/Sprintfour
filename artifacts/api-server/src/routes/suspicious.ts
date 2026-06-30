import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, documentsTable, redactionsTable } from "@workspace/db";
import { GetSuspiciousTextParams, GetSuspiciousTextResponse } from "@workspace/api-zod";

const router: IRouter = Router();

interface PiiPattern {
  regex: RegExp;
  reason: string;
  riskLevel: "low" | "medium" | "high";
}

const PII_PATTERNS: PiiPattern[] = [
  {
    regex: /\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    reason: "Possible phone number",
    riskLevel: "high",
  },
  {
    regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    reason: "Possible email address",
    riskLevel: "high",
  },
  {
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    reason: "Possible Social Security Number",
    riskLevel: "high",
  },
  {
    regex: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    reason: "Possible date of birth",
    riskLevel: "medium",
  },
  {
    regex: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    reason: "Possible date (could be DOB)",
    riskLevel: "low",
  },
  {
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    reason: "Possible credit card number",
    riskLevel: "high",
  },
  {
    regex: /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g,
    reason: "Possible person name with title",
    riskLevel: "high",
  },
  {
    regex: /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g,
    reason: "Possible person name",
    riskLevel: "medium",
  },
  {
    regex: /\b\d{5}(?:-\d{4})?\b/g,
    reason: "Possible ZIP code (part of address)",
    riskLevel: "low",
  },
  {
    regex: /\b(?:account|acct|policy|invoice|claim)\s*(?:#|number|no\.?|num\.?)?\s*:?\s*[\dA-Z]{4,}/gi,
    reason: "Possible account or policy number",
    riskLevel: "high",
  },
  {
    regex: /\b(?:DOB|Date of Birth|born|birthdate)\s*:?\s*\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/gi,
    reason: "Explicit date of birth reference",
    riskLevel: "high",
  },
  {
    regex: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)\b/gi,
    reason: "Possible street address",
    riskLevel: "high",
  },
];

interface SuspiciousMatch {
  startOffset: number;
  endOffset: number;
  text: string;
  reason: string;
  riskLevel: "low" | "medium" | "high";
}

function findSuspiciousSpans(
  content: string,
  redactedRanges: Array<{ start: number; end: number }>,
): SuspiciousMatch[] {
  const matches: SuspiciousMatch[] = [];
  const seen = new Set<string>();

  function isRedacted(start: number, end: number): boolean {
    return redactedRanges.some((r) => r.start <= start && r.end >= end);
  }

  for (const pattern of PII_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(content)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const text = match[0].trim();

      if (text.length < 2) continue;
      if (isRedacted(start, end)) continue;

      const key = `${start}-${end}`;
      if (seen.has(key)) continue;
      seen.add(key);

      matches.push({
        startOffset: start,
        endOffset: end,
        text,
        reason: pattern.reason,
        riskLevel: pattern.riskLevel,
      });
    }
  }

  // Deduplicate overlapping matches — keep the highest-risk one
  const deduped: SuspiciousMatch[] = [];
  const riskOrder = { high: 3, medium: 2, low: 1 };

  for (const m of matches) {
    const overlaps = deduped.some(
      (d) => !(m.endOffset <= d.startOffset || m.startOffset >= d.endOffset),
    );
    if (!overlaps) {
      deduped.push(m);
    } else {
      const idx = deduped.findIndex(
        (d) => !(m.endOffset <= d.startOffset || m.startOffset >= d.endOffset),
      );
      if (idx !== -1 && riskOrder[m.riskLevel] > riskOrder[deduped[idx].riskLevel]) {
        deduped[idx] = m;
      }
    }
  }

  return deduped.sort((a, b) => {
    const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    return riskDiff !== 0 ? riskDiff : a.startOffset - b.startOffset;
  });
}

router.get("/documents/:id/suspicious", async (req, res): Promise<void> => {
  const params = GetSuspiciousTextParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const activeRedactions = await db
    .select({
      startOffset: redactionsTable.startOffset,
      endOffset: redactionsTable.endOffset,
    })
    .from(redactionsTable)
    .where(
      sql`${redactionsTable.documentId} = ${params.data.id} AND ${redactionsTable.status} != 'rejected'`,
    );

  const redactedRanges = activeRedactions.map((r) => ({
    start: r.startOffset,
    end: r.endOffset,
  }));

  const suspicious = findSuspiciousSpans(doc.content, redactedRanges);

  res.json(GetSuspiciousTextResponse.parse(suspicious));
});

export default router;
