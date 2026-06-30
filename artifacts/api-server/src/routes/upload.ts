import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";

const router: IRouter = Router();

// Store file in memory (buffer) — no disk writes needed
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB cap
  fileFilter(_req, file, cb) {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/markdown",
      "application/octet-stream", // fallback for some docx uploads
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".docx", ".doc", ".txt", ".md", ".text"];
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype} (${ext})`));
    }
  },
});

/**
 * Minimal HTML sanitizer — keeps safe formatting tags only.
 * Strips scripts/style/event handlers but preserves document structure.
 */
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

/**
 * Extract plain text from HTML for the AI redaction engines.
 * Preserves newline boundaries so text offsets remain stable.
 */
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
    let contentType: "html" | "text" = "text";

    try {
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
          contentType = "html";
        } catch {
          htmlContent = buffer.toString("utf-8");
          contentType = "text";
        }
      } else {
        // Plain text / markdown — render as-is
        htmlContent = buffer.toString("utf-8").replace(/\0/g, "").replace(/\r\n/g, "\n").trim();
        contentType = "text";
      }

      // 'content' = plain text for AI engines (offset-stable)
      // 'htmlContent' = rich HTML for the document viewer
      const plainText = contentType === "html" ? htmlToPlainText(htmlContent) : htmlContent;

      const title =
        (req.body?.title as string | undefined)?.trim() ||
        originalname.replace(/\.[^.]+$/, "");

      res.json({
        title,
        content: plainText,
        htmlContent,
        contentType,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(422).json({ error: `Failed to extract text: ${message}` });
    }
  },
);

export default router;
