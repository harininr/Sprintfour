import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    console.log('Adding ignored to redaction_status...');
    await client.query(`ALTER TYPE "redaction_status" ADD VALUE IF NOT EXISTS 'ignored';`);
  } catch (e) {
    console.error('Error (might already exist):', e.message);
  }

  try {
    console.log('Adding consensus_data column...');
    await client.query(`ALTER TABLE "redactions" ADD COLUMN IF NOT EXISTS "consensus_data" text;`);
  } catch (e) {
    console.error('Error:', e.message);
  }

  try {
    console.log('Creating chat_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "chat_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "document_id" uuid NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "chat_history_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE
      );
    `);
  } catch (e) {
    console.error('Error:', e.message);
  }

  try {
    console.log('Creating review_sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "review_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "document_id" uuid NOT NULL,
        "user_id" text DEFAULT 'system' NOT NULL,
        "started_at" timestamp with time zone DEFAULT now() NOT NULL,
        "ended_at" timestamp with time zone,
        "actions_count" integer DEFAULT 0 NOT NULL,
        "time_spent_ms" integer DEFAULT 0 NOT NULL,
        "insights" text,
        CONSTRAINT "review_sessions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE
      );
    `);
  } catch (e) {
    console.error('Error:', e.message);
  }

  try {
    console.log('Creating audit_reports table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "audit_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "document_id" uuid NOT NULL,
        "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
        "score" integer DEFAULT 100 NOT NULL,
        "report_data" text,
        CONSTRAINT "audit_reports_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE
      );
    `);
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log('Migration completed.');
  await client.end();
}

run().catch(console.error);
