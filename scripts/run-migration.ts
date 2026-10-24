#!/usr/bin/env tsx
/**
 * Runs the international-stats-schema.sql migration via Supabase REST API.
 * Uses pg_query RPC to execute raw SQL.
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const sql = fs.readFileSync("./supabase/international-stats-schema.sql", "utf-8");

  // Split into individual statements and run each
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  console.log(`Running ${statements.length} SQL statements...`);
  for (const stmt of statements) {
    const { error } = await sb.rpc("exec_sql", { query: stmt + ";" });
    if (error && !error.message.includes("already exists") && !error.message.includes("does not exist")) {
      console.error(`  Error: ${error.message}\n  SQL: ${stmt.slice(0, 80)}...`);
    } else if (!error) {
      console.log(`  ✓ ${stmt.slice(0, 60).replace(/\n/g, " ")}...`);
    }
  }
  console.log("Done.");
}

main().catch(console.error);
