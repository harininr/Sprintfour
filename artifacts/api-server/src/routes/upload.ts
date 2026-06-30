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
    let extractedText = "";

    try {
      if (
        ext === ".docx" ||
        mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const mammoth = await import("mammoth");
        // Use convertToHtml to preserve table cell alignments (tabs) and paragraph breaks
        const result = await mammoth.convertToHtml({ buffer });
        extractedText = result.value
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<\/tr>/gi, '\n')
          .replace(/<\/td>/gi, '\t')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '') // strip remaining tags
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
      } else if (ext === ".doc" || mimetype === "application/msword") {
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.convertToHtml({ buffer });
          extractedText = result.value
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/tr>/gi, '\n')
            .replace(/<\/td>/gi, '\t')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
        } catch {
          extractedText = buffer.toString("utf-8");
        }
      } else {
        // Plain text / markdown
        extractedText = buffer.toString("utf-8");
      }

      // Strip null bytes and normalise whitespace
      extractedText = extractedText
        .replace(/\0/g, "")
        .replace(/\r\n/g, "\n")
        .trim();

      const title =
        (req.body?.title as string | undefined)?.trim() ||
        originalname.replace(/\.[^.]+$/, ""); // filename without extension

      res.json({ title, content: extractedText });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(422).json({ error: `Failed to extract text: ${message}` });
    }
  },
);

export default router;
