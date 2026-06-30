import { pgTable, text, uuid, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { documentsTable } from "./documents";

export const chatHistoryTable = pgTable("chat_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documentsTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewSessionsTable = pgTable("review_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documentsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().default("system"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  actionsCount: integer("actions_count").notNull().default(0),
  timeSpentMs: integer("time_spent_ms").notNull().default(0),
  insights: text("insights"), // JSON string
});

export const auditReportsTable = pgTable("audit_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documentsTable.id, { onDelete: "cascade" }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  score: integer("score").notNull().default(100),
  reportData: text("report_data"), // JSON string of the report
});
