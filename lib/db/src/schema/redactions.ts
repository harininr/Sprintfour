import { pgTable, text, uuid, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { documentsTable } from "./documents";

export const redactionCategoryEnum = pgEnum("redaction_category", [
  "name",
  "phone",
  "email",
  "address",
  "ssn",
  "dob",
  "financial",
  "medical",
  "organization",
  "other",
]);

export const redactionStatusEnum = pgEnum("redaction_status", [
  "pending",
  "confirmed",
  "rejected",
  "user_added",
  "ignored",
]);

export const redactionSourceEnum = pgEnum("redaction_source", ["ai", "user"]);

export const redactionsTable = pgTable("redactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documentsTable.id, { onDelete: "cascade" }),
  startOffset: integer("start_offset"), // Nullable for PDF-native redactions
  endOffset: integer("end_offset"),     // Nullable for PDF-native redactions
  boundingBoxes: text("bounding_boxes"), // JSON string storing [{page, x, y, width, height}]
  text: text("text").notNull(),
  category: redactionCategoryEnum("category").notNull().default("other"),
  confidence: real("confidence").notNull().default(0.5),
  status: redactionStatusEnum("status").notNull().default("pending"),
  source: redactionSourceEnum("source").notNull().default("ai"),
  note: text("note"),
  consensusData: text("consensus_data"), // storing JSON string for AI model votes
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRedactionSchema = createInsertSchema(redactionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRedaction = typeof redactionsTable.$inferInsert;
export type Redaction = typeof redactionsTable.$inferSelect;
