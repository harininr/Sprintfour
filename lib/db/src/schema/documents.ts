import { pgTable, text, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "in_review",
  "completed",
]);

export const documentsTable = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content"), // Made nullable to support raw file uploads where text extraction might fail or be async
  filePath: text("file_path"), // Path to the stored PDF file
  status: documentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = typeof documentsTable.$inferInsert;
export type Document = typeof documentsTable.$inferSelect;
