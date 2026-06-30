ALTER TABLE "documents" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "redactions" ALTER COLUMN "start_offset" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "redactions" ALTER COLUMN "end_offset" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_path" text;--> statement-breakpoint
ALTER TABLE "redactions" ADD COLUMN "bounding_boxes" text;