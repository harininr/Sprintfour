import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { z } from "zod";
import { decodeContent } from "./documents";

const router: IRouter = Router();

const ParamsSchema = z.object({ id: z.string().uuid() });

// ─── /documents/:id/export — HTML Audit Report ────────────────────────────────

router.get("/documents/:id/export", async (req, res): Promise<void> => {
  const params = ParamsSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.data.id)
    .single();

  if (docError || !doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const { data: redactions } = await supabase
    .from("redactions")
    .select("*")
    .eq("document_id", doc.id)
    .order("start_offset", { ascending: true });

  const activeRedactions = (redactions || []).filter(
    (r) => r.status === "confirmed" || r.status === "user_added"
  );

  // Apply redactions to plain text (reverse order to preserve offsets)
  let redactedContent = decodeContent(doc.content || "").plain;
  const sorted = [...activeRedactions].sort(
    (a, b) => b.start_offset - a.start_offset
  );
  for (const r of sorted) {
    redactedContent =
      redactedContent.substring(0, r.start_offset) +
      `[REDACTED ${r.category.toUpperCase()}]` +
      redactedContent.substring(r.end_offset);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Privacy Audit Report: ${doc.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 840px; margin: 40px auto; color: #2A1A0E; line-height: 1.6; background: #FDFAF5; padding: 0 20px; }
    h1 { border-bottom: 3px solid #6B1E2B; padding-bottom: 10px; color: #1E1E1E; }
    h2 { margin-top: 30px; color: #6B1E2B; }
    .stats { display: flex; gap: 16px; margin-bottom: 28px; }
    .stat-box { background: #fff; border: 1.5px solid #E2D5C3; padding: 16px 20px; border-radius: 12px; flex: 1; text-align: center; }
    .stat-box strong { display: block; font-size: 28px; color: #6B1E2B; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #E2D5C3; text-align: left; font-size: 14px; }
    th { background: #F5F0E8; font-weight: 700; color: #6B1E2B; }
    .content-box { background: #fff; border: 1.5px solid #E2D5C3; padding: 24px; border-radius: 12px; font-family: 'Courier New', monospace; white-space: pre-wrap; font-size: 13px; line-height: 1.7; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #F5E8E8; color: #6B1E2B; border: 1px solid #D4A8A8; }
  </style>
</head>
<body>
  <h1>🛡️ Privacy Audit Report</h1>
  <p><strong>Document:</strong> ${doc.title}</p>
  <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Status:</strong> ${doc.status}</p>

  <h2>Audit Statistics</h2>
  <div class="stats">
    <div class="stat-box"><strong>${activeRedactions.length}</strong>Items Redacted</div>
    <div class="stat-box"><strong>${(redactions || []).length}</strong>Total Detected</div>
    <div class="stat-box"><strong>${(redactions || []).filter((r) => r.status === "rejected").length}</strong>False Positives</div>
  </div>

  <h2>Redaction Log</h2>
  <table>
    <thead><tr><th>Category</th><th>Original Text</th><th>Source</th></tr></thead>
    <tbody>
      ${activeRedactions
        .map(
          (r) =>
            `<tr>
              <td><span class="badge">${r.category.toUpperCase()}</span></td>
              <td>${r.text}</td>
              <td>${r.source === "ai" ? "AI Detection" : "User Added"}</td>
            </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>Redacted Document Content</h2>
  <div class="content-box">${redactedContent
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="audit_report_${doc.id.substring(0, 8)}.html"`
  );
  res.send(html);
});

// ─── /documents/:id/export-redacted — Redacted PDF ────────────────────────────

router.get(
  "/documents/:id/export-redacted",
  async (req, res): Promise<void> => {
    const params = ParamsSchema.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, title, content, file_path")
      .eq("id", params.data.id)
      .single();

    if (docError || !doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const { data: redactions, error: redactionsError } = await supabase
      .from("redactions")
      .select("*")
      .eq("document_id", doc.id)
      .in("status", ["confirmed", "user_added"])
      .order("start_offset", { ascending: true });

    if (redactionsError) {
      res.status(500).json({ error: "Failed to fetch redactions" });
      return;
    }

    // ── Attempt: load original PDF from disk and draw black rectangles ──────
    const ext = doc.title.split(".").pop()?.toLowerCase();
    const isPdf = ext === "pdf";

    if (isPdf && doc.file_path) {
      try {
        const { PDFDocument, rgb } = require("pdf-lib");
        const fs = require("fs");

        if (fs.existsSync(doc.file_path)) {
          const pdfBytes = fs.readFileSync(doc.file_path);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const pages = pdfDoc.getPages();

          for (const r of redactions || []) {
            if (!r.bounding_boxes) continue;
            try {
              const boxes = JSON.parse(r.bounding_boxes);
              for (const box of boxes) {
                const pageIndex = (box.page || 1) - 1;
                if (pageIndex >= 0 && pageIndex < pages.length) {
                  const page = pages[pageIndex];
                  // PDF coordinate origin is bottom-left; convert from top-left
                  const y = page.getHeight() - box.y - box.height;
                  page.drawRectangle({
                    x: box.x,
                    y,
                    width: box.width,
                    height: box.height,
                    color: rgb(0, 0, 0),
                  });
                }
              }
            } catch {
              // Skip malformed bounding boxes silently
            }
          }

          const pdfBytesModified = await pdfDoc.save();
          const filename = safeFilename(doc.title, "REDACTED");
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
          );
          res.send(Buffer.from(pdfBytesModified));
          return;
        }
      } catch (err) {
        console.error("PDF bounding box redaction failed, falling back:", err);
        // Fall through to text-based PDF generation
      }
    }

    // ── Fallback: rebuild PDF from plain text with black-bar redactions ──────
    // This works for: PDF (no file_path), DOCX, TXT — any source.
    try {
      const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

      const contentStr = decodeContent(doc.content || "").plain;
      const activeRedactions = (redactions || []).filter(
        (r) => r.start_offset != null && r.end_offset != null
      );
      const sortedRedactions = [...activeRedactions].sort(
        (a, b) => Number(a.start_offset) - Number(b.start_offset)
      );

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Courier);
      const boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

      const PAGE_MARGIN = 56;
      const FONT_SIZE = 11;
      const LINE_HEIGHT = 16;
      const HEADER_HEIGHT = 60;

      // Helper: add a new page and reset cursor
      const addPage = () => {
        const p = pdfDoc.addPage([595, 842]); // A4
        const y = p.getHeight() - PAGE_MARGIN - HEADER_HEIGHT;
        // Header stripe
        p.drawRectangle({
          x: 0,
          y: p.getHeight() - HEADER_HEIGHT,
          width: p.getWidth(),
          height: HEADER_HEIGHT,
          color: rgb(0.42, 0.12, 0.17), // #6B1E2B
        });
        p.drawText("REDACTED DOCUMENT", {
          x: PAGE_MARGIN,
          y: p.getHeight() - 34,
          size: 16,
          font: boldFont,
          color: rgb(1, 1, 1),
        });
        const shortTitle =
          doc.title.length > 60 ? doc.title.substring(0, 57) + "..." : doc.title;
        p.drawText(shortTitle, {
          x: PAGE_MARGIN,
          y: p.getHeight() - 52,
          size: 9,
          font,
          color: rgb(0.9, 0.85, 0.82),
        });
        return { page: p, cursorX: PAGE_MARGIN, cursorY: y };
      };

      let { page, cursorX, cursorY } = addPage();
      const maxWidth = page.getWidth() - PAGE_MARGIN * 2;

      /** Replace non-encodable characters so pdf-lib doesn't throw */
      const clean = (s: string) =>
        s
          .replace(/\r/g, " ")
          .replace(/[""]/g, '"')
          .replace(/['']/g, "'")
          .replace(/—/g, "-")
          .replace(/–/g, "-")
          .replace(/•/g, "*")
          .replace(/ﬁ/g, "fi")
          .replace(/ﬂ/g, "fl")
          .replace(/ﬀ/g, "ff")
          .replace(/[^\x00-\x7F]/g, "?");

      const ensureSpace = () => {
        if (cursorY < PAGE_MARGIN + LINE_HEIGHT) {
          ({ page, cursorX, cursorY } = addPage());
          cursorX = PAGE_MARGIN;
        }
      };

      /**
       * Render a chunk of text (or a redaction black bar) word-by-word.
       * isRedacted=true draws a solid black rectangle instead of text.
       */
      const renderChunk = (text: string, isRedacted: boolean) => {
        const tokens = text.split(/([ \t\n])/);
        for (const token of tokens) {
          if (!token) continue;

          if (token === "\n") {
            cursorX = PAGE_MARGIN;
            cursorY -= LINE_HEIGHT;
            ensureSpace();
            continue;
          }

          if (token === " " || token === "\t") {
            const w = font.widthOfTextAtSize(" ", FONT_SIZE);
            if (isRedacted) {
              page.drawRectangle({
                x: cursorX,
                y: cursorY - 2,
                width: w,
                height: FONT_SIZE + 2,
                color: rgb(0, 0, 0),
              });
            }
            cursorX += w;
            continue;
          }

          const safeToken = clean(token);
          let w: number;
          try {
            w = font.widthOfTextAtSize(safeToken, FONT_SIZE);
          } catch {
            w = safeToken.length * 6.5;
          }

          // Wrap to next line if needed
          if (cursorX + w > PAGE_MARGIN + maxWidth) {
            cursorX = PAGE_MARGIN;
            cursorY -= LINE_HEIGHT;
            ensureSpace();
          }

          if (isRedacted) {
            // Black bar — same width as text, slightly taller for clean look
            page.drawRectangle({
              x: cursorX,
              y: cursorY - 2,
              width: w + 1,
              height: FONT_SIZE + 4,
              color: rgb(0, 0, 0),
            });
          } else {
            try {
              page.drawText(safeToken, {
                x: cursorX,
                y: cursorY,
                size: FONT_SIZE,
                font,
                color: rgb(0.12, 0.08, 0.04),
              });
            } catch {
              // Skip tokens that still can't be encoded
            }
          }
          cursorX += w;
        }
      };

      // Walk through the content, alternating normal ↔ redacted spans
      let lastIdx = 0;
      for (const r of sortedRedactions) {
        const start = Number(r.start_offset);
        const end = Number(r.end_offset);
        if (start > lastIdx) {
          renderChunk(contentStr.substring(lastIdx, start), false);
        }
        const chunkStart = Math.max(lastIdx, start);
        if (end > chunkStart) {
          renderChunk(contentStr.substring(chunkStart, end), true);
        }
        lastIdx = Math.max(lastIdx, end);
      }
      if (lastIdx < contentStr.length) {
        renderChunk(contentStr.substring(lastIdx), false);
      }

      // Footer on last page
      page.drawText(
        `Generated by Redact Review · ${new Date().toLocaleString()} · ${activeRedactions.length} item(s) redacted`,
        {
          x: PAGE_MARGIN,
          y: PAGE_MARGIN - 14,
          size: 8,
          font,
          color: rgb(0.6, 0.5, 0.45),
        }
      );

      const pdfBytes = await pdfDoc.save();
      const filename = safeFilename(doc.title, "REDACTED");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(Buffer.from(pdfBytes));
    } catch (err) {
      console.error("Error generating redacted PDF:", err);
      res.status(500).json({ error: "Failed to generate redacted PDF." });
    }
  }
);

/** Build a safe filename for the export. */
function safeFilename(title: string, suffix: string): string {
  const base = title
    .replace(/\.[^.]+$/, "") // strip original extension
    .replace(/[^a-zA-Z0-9_\- ]/g, "_")
    .substring(0, 60)
    .trim();
  return `${base}_${suffix}.pdf`;
}

export default router;
