import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const router: IRouter = Router();

// Store file in memory — no disk writes
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB cap
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".docx", ".doc", ".txt", ".md", ".text", ".pdf"];
    const allowedMime = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/octet-stream", // fallback for some uploads
    ];
    if (allowedMime.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype} (${ext})`));
    }
  },
});

/** Minimal HTML sanitizer — keeps safe formatting tags, strips scripts/handlers. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, "\u00a0");
}

/** Extract plain text from HTML preserving newlines so offsets stay stable. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Clean PDF text: normalize whitespace, remove null bytes, fix common encoding artifacts. */
function cleanPdfText(raw: string): string {
  return raw
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove repeated spaces from PDF column layout artifacts
    .replace(/ {3,}/g, "  ")
    // Fix ligature artifacts common in PDFs
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬃ/g, "ffi")
    .replace(/ﬄ/g, "ffl")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

router.post(
  "/documents/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const { originalname, buffer, mimetype } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    let htmlContent = "";
    let contentType: "html" | "text" | "pdf" = "text";
    let plainText = "";

    try {
      // ── DOCX / DOC ─────────────────────────────────────────────────────
      if (
        ext === ".docx" ||
        ext === ".doc" ||
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimetype === "application/msword"
      ) {
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.convertToHtml({ buffer });
          htmlContent = sanitizeHtml(result.value);
          plainText = htmlToPlainText(htmlContent);
          contentType = "html";
        } catch {
          plainText = buffer.toString("utf-8");
          htmlContent = plainText;
          contentType = "text";
        }

      // ── PDF ─────────────────────────────────────────────────────────────
      } else if (ext === ".pdf" || mimetype === "application/pdf") {
        try {
          const pdfData = await pdfParse(buffer);
          plainText = cleanPdfText(pdfData.text);
          // Render PDF plain text as pre-formatted HTML so the viewer
          // preserves line breaks and paragraph structure
          htmlContent =
            `<div class="pdf-content"><pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.7;">` +
            plainText
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;") +
            `</pre></div>`;
          contentType = "pdf";
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          res.status(422).json({ error: `Failed to parse PDF: ${msg}` });
          return;
        }

      // ── Plain text / Markdown ───────────────────────────────────────────
      } else {
        plainText = buffer
          .toString("utf-8")
          .replace(/\0/g, "")
          .replace(/\r\n/g, "\n")
          .trim();
        htmlContent = plainText;
        contentType = "text";
      }

      const title =
        (req.body?.title as string | undefined)?.trim() ||
        originalname.replace(/\.[^.]+$/, "");

      res.json({
        title,
        content: plainText,        // plain text for AI engines (offset-stable)
        htmlContent,               // rich HTML / pre-formatted for the viewer
        contentType,               // "html" | "pdf" | "text"
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(422).json({ error: `Failed to extract text: ${message}` });
    }
  },
);

export default router;
