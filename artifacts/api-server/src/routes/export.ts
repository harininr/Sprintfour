import { Router, type IRouter } from "express";
import { supabase } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const ParamsSchema = z.object({ id: z.string().uuid() });

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

  // Apply redactions
  let redactedContent = doc.content;
  const activeRedactions = (redactions || []).filter(r => r.status === "confirmed" || r.status === "user_added");
  const sorted = activeRedactions.sort((a, b) => b.start_offset - a.start_offset);
  for (const r of sorted) {
    redactedContent = redactedContent.substring(0, r.start_offset) + `[REDACTED ${r.category.toUpperCase()}]` + redactedContent.substring(r.end_offset);
  }

  // Generate HTML Report
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Privacy Audit Report: ${doc.title}</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; color: #333; line-height: 1.6; }
        h1 { border-bottom: 2px solid #6B1E2B; padding-bottom: 10px; color: #1E1E1E; }
        h2 { margin-top: 30px; color: #444; }
        .stats { display: flex; gap: 20px; margin-bottom: 30px; }
        .stat-box { background: #f4f4f4; padding: 15px 20px; border-radius: 8px; flex: 1; text-align: center; }
        .stat-box strong { display: block; font-size: 24px; color: #6B1E2B; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
        th { background: #f9f9f9; }
        .content-box { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; font-size: 14px; }
      </style>
    </head>
    <body>
      <h1>Privacy Audit Report</h1>
      <p><strong>Document:</strong> ${doc.title}</p>
      <p><strong>Exported On:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Status:</strong> ${doc.status}</p>

      <h2>Audit Statistics</h2>
      <div class="stats">
        <div class="stat-box">
          <strong>${activeRedactions.length}</strong>
          Items Redacted
        </div>
        <div class="stat-box">
          <strong>${(redactions || []).length}</strong>
          Total Entities Detected
        </div>
        <div class="stat-box">
          <strong>${(redactions || []).filter(r => r.status === "rejected").length}</strong>
          False Positives Rejected
        </div>
      </div>

      <h2>Redaction Log</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Original Text</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          ${activeRedactions.map(r => `
            <tr>
              <td>${r.category.toUpperCase()}</td>
              <td>${r.text}</td>
              <td>${r.source === "ai" ? "AI Detection" : "User Added"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <h2>Redacted Document Content</h2>
      <div class="content-box">${redactedContent}</div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="audit_report_${doc.id.substring(0, 8)}.html"`);
  res.send(html);
});

router.get("/documents/:id/export-redacted", async (req, res): Promise<void> => {
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

  const { data: redactions } = await supabase
    .from("redactions")
    .select("start_offset, end_offset, category, text, bounding_boxes")
    .eq("document_id", doc.id)
    .in("status", ["confirmed", "user_added", "pending"])
    .order("start_offset", { ascending: false });

  const originalExt = doc.title.split('.').pop()?.toLowerCase();
  const isPdf = originalExt === 'pdf' || (doc.file_path && doc.file_path.toLowerCase().endsWith('.pdf'));

  if (doc.file_path && isPdf) {
    try {
      const { PDFDocument, rgb } = require("pdf-lib");
      const fs = require("fs");
      const pdfBytes = fs.readFileSync(doc.file_path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      for (const r of (redactions || [])) {
        if (!r.bounding_boxes) continue;
        try {
          const boxes = JSON.parse(r.bounding_boxes);
          for (const box of boxes) {
            const pageIndex = box.page - 1;
            if (pageIndex >= 0 && pageIndex < pages.length) {
              const page = pages[pageIndex];
              const y = page.getHeight() - box.y - box.height;
              
              page.drawRectangle({
                x: box.x,
                y: y,
                width: box.width,
                height: box.height,
                color: rgb(0, 0, 0),
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse bounding boxes for redaction:", e);
        }
      }

      const pdfBytesModified = await pdfDoc.save();
      const filename = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_REDACTED.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(Buffer.from(pdfBytesModified));
      return;
    } catch (err) {
      console.error("Error creating redacted PDF:", err);
      res.status(500).json({ error: "Failed to generate redacted PDF." });
      return;
    }
  }

  // Fallback: Generate a PDF for text/docx documents
  try {
    const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = 16;
    const margin = 50;
    const maxWidth = page.getWidth() - margin * 2;

    let cursorX = margin;
    let cursorY = page.getHeight() - margin;

    const activeRedactions = (redactions || []).filter(r => r.start_offset != null && r.end_offset != null);
    const sorted = [...activeRedactions].sort((a, b) => Number(a.start_offset) - Number(b.start_offset));

    let lastIdx = 0;
    const contentStr = doc.content || "";
    
    // Replace non-ASCII characters with standard equivalents to avoid pdf-lib encoding errors
    // while preserving string length to keep offsets accurate.
    const cleanToken = (str: string) => str
      .replace(/\r/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/—/g, "-")
      .replace(/–/g, "-")
      .replace(/•/g, "*")
      .replace(/[^\x00-\x7F]/g, "?");

    const processChunk = (text: string, isRedacted: boolean) => {
      const tokens = text.split(/([ \n])/); // keep spaces and newlines as tokens
      for (const token of tokens) {
        if (!token) continue;
        if (token === '\n') {
          cursorX = margin;
          cursorY -= lineHeight;
          if (cursorY < margin) {
            page = pdfDoc.addPage();
            cursorY = page.getHeight() - margin;
          }
        } else if (token === ' ') {
          const w = font.widthOfTextAtSize(' ', fontSize);
          if (isRedacted) {
            page.drawRectangle({ x: cursorX, y: cursorY - 3, width: w + 1, height: fontSize + 4, color: rgb(0, 0, 0) });
          }
          cursorX += w;
        } else {
          const safeToken = cleanToken(token);
          let w = 0;
          try { w = font.widthOfTextAtSize(safeToken, fontSize); } catch (e) { w = safeToken.length * 6; }
          
          if (cursorX + w > margin + maxWidth) {
            cursorX = margin;
            cursorY -= lineHeight;
            if (cursorY < margin) {
              page = pdfDoc.addPage();
              cursorY = page.getHeight() - margin;
            }
          }
          if (isRedacted) {
            // Draw a black rectangle over the text area
            page.drawRectangle({ x: cursorX, y: cursorY - 3, width: w + 1, height: fontSize + 4, color: rgb(0, 0, 0) });
          } else {
            page.drawText(safeToken, { x: cursorX, y: cursorY, size: fontSize, font: font, color: rgb(0, 0, 0) });
          }
          cursorX += w;
        }
      }
    };

    for (const r of sorted) {
      const start = Number(r.start_offset);
      const end = Number(r.end_offset);
      
      if (start > lastIdx) {
        processChunk(contentStr.substring(lastIdx, start), false);
      }
      
      const chunkStart = Math.max(lastIdx, start);
      if (end > chunkStart) {
        // Redact this chunk
        processChunk(contentStr.substring(chunkStart, end), true);
      }
      
      lastIdx = Math.max(lastIdx, end);
    }
    
    if (lastIdx < contentStr.length) {
      processChunk(contentStr.substring(lastIdx), false);
    }

    const pdfBytesGenerated = await pdfDoc.save();
    const filenameGen = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_REDACTED.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filenameGen}"`);
    res.send(Buffer.from(pdfBytesGenerated));
  } catch (err) {
    console.error("Error creating generated PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF." });
  }
});

export default router;
