CREATE TYPE "public"."document_status" AS ENUM('pending', 'in_review', 'completed');--> statement-breakpoint
CREATE TYPE "public"."redaction_category" AS ENUM('name', 'phone', 'email', 'address', 'ssn', 'dob', 'financial', 'medical', 'organization', 'other');--> statement-breakpoint
CREATE TYPE "public"."redaction_source" AS ENUM('ai', 'user');--> statement-breakpoint
CREATE TYPE "public"."redaction_status" AS ENUM('pending', 'confirmed', 'rejected', 'user_added', 'ignored');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status" "document_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"start_offset" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"text" text NOT NULL,
	"category" "redaction_category" DEFAULT 'other' NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"status" "redaction_status" DEFAULT 'pending' NOT NULL,
	"source" "redaction_source" DEFAULT 'ai' NOT NULL,
	"note" text,
	"consensus_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"score" integer DEFAULT 100 NOT NULL,
	"report_data" text
);
--> statement-breakpoint
CREATE TABLE "chat_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" text DEFAULT 'system' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"actions_count" integer DEFAULT 0 NOT NULL,
	"time_spent_ms" integer DEFAULT 0 NOT NULL,
	"insights" text
);
--> statement-breakpoint
ALTER TABLE "redactions" ADD CONSTRAINT "redactions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;