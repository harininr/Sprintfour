import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Read DATABASE_URL from .env at root
dotenv.config({ path: '../../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'pgbouncer=true'
});

async function run() {
  const sql = fs.readFileSync('./drizzle/0001_salty_cammi.sql', 'utf8');
  console.log("Running migration...");
  await pool.query(sql.replace(/--> statement-breakpoint/g, ';'));
  console.log("Done!");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
