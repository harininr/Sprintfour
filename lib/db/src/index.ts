import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

let currentDir: string;
try {
  // @ts-ignore – __dirname exists in CJS
  currentDir = __dirname;
} catch {
  currentDir = path.dirname(fileURLToPath(import.meta.url));
}

const envPath = path.resolve(currentDir, "../../../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables. DB connection will fail.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Re-export schema components so other packages can use the types
export * from "./schema";


