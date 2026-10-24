#!/usr/bin/env tsx
// ============================================================
// SETPIECE — Seed WC 2026 fixtures into Supabase
// Runs both wc-schema.sql and wc-fixtures-seed.sql via REST API
//
// Usage:
//   npx tsx --env-file=.env.local scripts/seed-wc-fixtures.ts
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!sbUrl || !sbKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(sbUrl, sbKey);

// ── Run a SQL statement via Supabase RPC ────────────────────
// Supabase doesn't expose a raw SQL endpoint on the anon key,
// so we insert the fixture rows directly via the JS client.

async function runSchema(): Promise<void> {
  console.log("[1/2] Ensuring wc_fixtures table exists...");
  // We check if the table is accessible — if it fails, remind user to run the schema SQL
  const { error } = await supabase.from("wc_fixtures").select("id").limit(1);
  if (error) {
    console.error(
      "\n⚠  Table wc_fixtures does not exist or is inaccessible.",
      "\nPlease run supabase/wc-schema.sql in your Supabase SQL Editor first,",
      "\nthen re-run this script.\n"
    );
    process.exit(1);
  }
  console.log("   wc_fixtures table OK");
}

// ── Parse and insert the seed data directly ─────────────────
const FIXTURES: Array<{
  fixture_id: number;
  match_date: string;
  kickoff_at: string;
  home_team: string;
  away_team: string;
  venue: string;
  city: string;
  stage: string;
  group_name: string | null;
  status: string;
}> = [
  // GROUP A: Mexico · South Africa · South Korea · Czechia
  { fixture_id: 900001, match_date: "2026-06-11", kickoff_at: "2026-06-11T19:00:00Z", home_team: "Mexico",        away_team: "South Africa",      venue: "Estadio Azteca",          city: "Mexico City",      stage: "Group A", group_name: "A", status: "NS" },
  { fixture_id: 900002, match_date: "2026-06-12", kickoff_at: "2026-06-12T02:00:00Z", home_team: "South Korea",   away_team: "Czechia",            venue: "Estadio Akron",           city: "Guadalajara",      stage: "Group A", group_name: "A", status: "NS" },
  { fixture_id: 900003, match_date: "2026-06-16", kickoff_at: "2026-06-16T22:00:00Z", home_team: "Mexico",        away_team: "South Korea",        venue: "Estadio Azteca",          city: "Mexico City",      stage: "Group A", group_name: "A", status: "NS" },
  { fixture_id: 900004, match_date: "2026-06-16", kickoff_at: "2026-06-16T19:00:00Z", home_team: "South Africa",  away_team: "Czechia",            venue: "NRG Stadium",             city: "Houston",          stage: "Group A", group_name: "A", status: "NS" },
  { fixture_id: 900005, match_date: "2026-06-24", kickoff_at: "2026-06-24T21:00:00Z", home_team: "Mexico",        away_team: "Czechia",            venue: "Estadio Azteca",          city: "Mexico City",      stage: "Group A", group_name: "A", status: "NS" },
  { fixture_id: 900006, match_date: "2026-06-24", kickoff_at: "2026-06-24T21:00:00Z", home_team: "South Korea",   away_team: "South Africa",       venue: "SoFi Stadium",            city: "Los Angeles",      stage: "Group A", group_name: "A", status: "NS" },

  // GROUP B: Canada · Bosnia-Herzegovina · Qatar · Switzerland
  { fixture_id: 900007, match_date: "2026-06-12", kickoff_at: "2026-06-12T19:00:00Z", home_team: "Canada",              away_team: "Bosnia-Herzegovina", venue: "BMO Field",               city: "Toronto",          stage: "Group B", group_name: "B", status: "NS" },
  { fixture_id: 900008, match_date: "2026-06-12", kickoff_at: "2026-06-12T22:00:00Z", home_team: "Qatar",               away_team: "Switzerland",        venue: "Levi's Stadium",          city: "Santa Clara",      stage: "Group B", group_name: "B", status: "NS" },
  { fixture_id: 900009, match_date: "2026-06-17", kickoff_at: "2026-06-17T19:00:00Z", home_team: "Canada",              away_team: "Qatar",              venue: "BC Place",                city: "Vancouver",        stage: "Group B", group_name: "B", status: "NS" },
  { fixture_id: 900010, match_date: "2026-06-17", kickoff_at: "2026-06-17T22:00:00Z", home_team: "Bosnia-Herzegovina",  away_team: "Switzerland",        venue: "Gillette Stadium",        city: "Boston",           stage: "Group B", group_name: "B", status: "NS" },
  { fixture_id: 900011, match_date: "2026-06-24", kickoff_at: "2026-06-24T17:00:00Z", home_team: "Canada",              away_team: "Switzerland",        venue: "BC Place",                city: "Vancouver",        stage: "Group B", group_name: "B", status: "NS" },
  { fixture_id: 900012, match_date: "2026-06-24", kickoff_at: "2026-06-24T17:00:00Z", home_team: "Bosnia-Herzegovina",  away_team: "Qatar",              venue: "BMO Field",               city: "Toronto",          stage: "Group B", group_name: "B", status: "NS" },

  // GROUP C: Brazil · Morocco · Haiti · Scotland
  { fixture_id: 900013, match_date: "2026-06-13", kickoff_at: "2026-06-13T19:00:00Z", home_team: "Brazil",   away_team: "Morocco",  venue: "MetLife Stadium",         city: "East Rutherford", stage: "Group C", group_name: "C", status: "NS" },
  { fixture_id: 900014, match_date: "2026-06-13", kickoff_at: "2026-06-13T22:00:00Z", home_team: "Haiti",    away_team: "Scotland", venue: "AT&T Stadium",            city: "Arlington",        stage: "Group C", group_name: "C", status: "NS" },
  { fixture_id: 900015, match_date: "2026-06-18", kickoff_at: "2026-06-18T19:00:00Z", home_team: "Brazil",   away_team: "Haiti",    venue: "NRG Stadium",             city: "Houston",          stage: "Group C", group_name: "C", status: "NS" },
  { fixture_id: 900016, match_date: "2026-06-18", kickoff_at: "2026-06-18T22:00:00Z", home_team: "Morocco",  away_team: "Scotland", venue: "Lincoln Financial Field", city: "Philadelphia",     stage: "Group C", group_name: "C", status: "NS" },
  { fixture_id: 900017, match_date: "2026-06-24", kickoff_at: "2026-06-24T01:00:00Z", home_team: "Brazil",   away_team: "Scotland", venue: "MetLife Stadium",         city: "East Rutherford", stage: "Group C", group_name: "C", status: "NS" },
  { fixture_id: 900018, match_date: "2026-06-24", kickoff_at: "2026-06-24T01:00:00Z", home_team: "Morocco",  away_team: "Haiti",    venue: "Hard Rock Stadium",       city: "Miami",            stage: "Group C", group_name: "C", status: "NS" },

  // GROUP D: United States · Paraguay · Australia · Turkey
  { fixture_id: 900019, match_date: "2026-06-13", kickoff_at: "2026-06-13T01:00:00Z", home_team: "United States", away_team: "Paraguay",   venue: "SoFi Stadium",   city: "Los Angeles", stage: "Group D", group_name: "D", status: "NS" },
  { fixture_id: 900020, match_date: "2026-06-13", kickoff_at: "2026-06-13T04:00:00Z", home_team: "Australia",     away_team: "Turkey",     venue: "BC Place",       city: "Vancouver",   stage: "Group D", group_name: "D", status: "NS" },
  { fixture_id: 900021, match_date: "2026-06-18", kickoff_at: "2026-06-18T01:00:00Z", home_team: "United States", away_team: "Australia",  venue: "AT&T Stadium",   city: "Arlington",   stage: "Group D", group_name: "D", status: "NS" },
  { fixture_id: 900022, match_date: "2026-06-18", kickoff_at: "2026-06-18T04:00:00Z", home_team: "Paraguay",      away_team: "Turkey",     venue: "Arrowhead Stadium", city: "Kansas City", stage: "Group D", group_name: "D", status: "NS" },
  { fixture_id: 900023, match_date: "2026-06-25", kickoff_at: "2026-06-25T21:00:00Z", home_team: "United States", away_team: "Turkey",     venue: "AT&T Stadium",   city: "Arlington",   stage: "Group D", group_name: "D", status: "NS" },
  { fixture_id: 900024, match_date: "2026-06-25", kickoff_at: "2026-06-25T21:00:00Z", home_team: "Australia",     away_team: "Paraguay",   venue: "Arrowhead Stadium", city: "Kansas City", stage: "Group D", group_name: "D", status: "NS" },

  // GROUP E: Germany · Curaçao · Ivory Coast · Ecuador
  { fixture_id: 900025, match_date: "2026-06-14", kickoff_at: "2026-06-14T19:00:00Z", home_team: "Germany",     away_team: "Curaçao",      venue: "Mercedes-Benz Stadium",   city: "Atlanta",     stage: "Group E", group_name: "E", status: "NS" },
  { fixture_id: 900026, match_date: "2026-06-14", kickoff_at: "2026-06-14T22:00:00Z", home_team: "Ivory Coast", away_team: "Ecuador",      venue: "Lumen Field",             city: "Seattle",     stage: "Group E", group_name: "E", status: "NS" },
  { fixture_id: 900027, match_date: "2026-06-19", kickoff_at: "2026-06-19T19:00:00Z", home_team: "Germany",     away_team: "Ivory Coast",  venue: "Hard Rock Stadium",       city: "Miami",       stage: "Group E", group_name: "E", status: "NS" },
  { fixture_id: 900028, match_date: "2026-06-19", kickoff_at: "2026-06-19T22:00:00Z", home_team: "Curaçao",     away_team: "Ecuador",      venue: "Lincoln Financial Field", city: "Philadelphia",stage: "Group E", group_name: "E", status: "NS" },
  { fixture_id: 900029, match_date: "2026-06-25", kickoff_at: "2026-06-25T17:00:00Z", home_team: "Germany",     away_team: "Ecuador",      venue: "Mercedes-Benz Stadium",   city: "Atlanta",     stage: "Group E", group_name: "E", status: "NS" },
  { fixture_id: 900030, match_date: "2026-06-25", kickoff_at: "2026-06-25T17:00:00Z", home_team: "Ivory Coast", away_team: "Curaçao",      venue: "Gillette Stadium",        city: "Boston",      stage: "Group E", group_name: "E", status: "NS" },

  // GROUP F: Netherlands · Japan · Sweden · Tunisia
  { fixture_id: 900031, match_date: "2026-06-15", kickoff_at: "2026-06-15T01:00:00Z", home_team: "Netherlands", away_team: "Japan",     venue: "Gillette Stadium",  city: "Boston",          stage: "Group F", group_name: "F", status: "NS" },
  { fixture_id: 900032, match_date: "2026-06-15", kickoff_at: "2026-06-15T04:00:00Z", home_team: "Sweden",      away_team: "Tunisia",   venue: "Hard Rock Stadium", city: "Miami",           stage: "Group F", group_name: "F", status: "NS" },
  { fixture_id: 900033, match_date: "2026-06-20", kickoff_at: "2026-06-20T01:00:00Z", home_team: "Netherlands", away_team: "Sweden",    venue: "MetLife Stadium",   city: "East Rutherford", stage: "Group F", group_name: "F", status: "NS" },
  { fixture_id: 900034, match_date: "2026-06-20", kickoff_at: "2026-06-20T04:00:00Z", home_team: "Japan",       away_team: "Tunisia",   venue: "Levi's Stadium",    city: "Santa Clara",     stage: "Group F", group_name: "F", status: "NS" },
  { fixture_id: 900035, match_date: "2026-06-25", kickoff_at: "2026-06-25T01:00:00Z", home_team: "Netherlands", away_team: "Tunisia",   venue: "MetLife Stadium",   city: "East Rutherford", stage: "Group F", group_name: "F", status: "NS" },
  { fixture_id: 900036, match_date: "2026-06-25", kickoff_at: "2026-06-25T01:00:00Z", home_team: "Sweden",      away_team: "Japan",     venue: "SoFi Stadium",      city: "Los Angeles",     stage: "Group F", group_name: "F", status: "NS" },

  // GROUP G: Belgium · Egypt · Iran · New Zealand
  { fixture_id: 900037, match_date: "2026-06-15", kickoff_at: "2026-06-15T19:00:00Z", home_team: "Belgium",     away_team: "Egypt",        venue: "Lumen Field",             city: "Seattle",      stage: "Group G", group_name: "G", status: "NS" },
  { fixture_id: 900038, match_date: "2026-06-15", kickoff_at: "2026-06-15T22:00:00Z", home_team: "Iran",        away_team: "New Zealand",  venue: "Lincoln Financial Field", city: "Philadelphia", stage: "Group G", group_name: "G", status: "NS" },
  { fixture_id: 900039, match_date: "2026-06-20", kickoff_at: "2026-06-20T19:00:00Z", home_team: "Belgium",     away_team: "Iran",         venue: "Arrowhead Stadium",       city: "Kansas City",  stage: "Group G", group_name: "G", status: "NS" },
  { fixture_id: 900040, match_date: "2026-06-20", kickoff_at: "2026-06-20T22:00:00Z", home_team: "Egypt",       away_team: "New Zealand",  venue: "AT&T Stadium",            city: "Arlington",    stage: "Group G", group_name: "G", status: "NS" },
  { fixture_id: 900041, match_date: "2026-06-26", kickoff_at: "2026-06-26T21:00:00Z", home_team: "Belgium",     away_team: "New Zealand",  venue: "Lumen Field",             city: "Seattle",      stage: "Group G", group_name: "G", status: "NS" },
  { fixture_id: 900042, match_date: "2026-06-26", kickoff_at: "2026-06-26T21:00:00Z", home_team: "Egypt",       away_team: "Iran",         venue: "NRG Stadium",             city: "Houston",      stage: "Group G", group_name: "G", status: "NS" },

  // GROUP H: Spain · Cape Verde · Saudi Arabia · Uruguay
  { fixture_id: 900043, match_date: "2026-06-15", kickoff_at: "2026-06-15T22:00:00Z", home_team: "Spain",       away_team: "Cape Verde",    venue: "Mercedes-Benz Stadium", city: "Atlanta",     stage: "Group H", group_name: "H", status: "NS" },
  { fixture_id: 900044, match_date: "2026-06-16", kickoff_at: "2026-06-16T01:00:00Z", home_team: "Saudi Arabia",away_team: "Uruguay",       venue: "Hard Rock Stadium",     city: "Miami",       stage: "Group H", group_name: "H", status: "NS" },
  { fixture_id: 900045, match_date: "2026-06-21", kickoff_at: "2026-06-21T01:00:00Z", home_team: "Spain",       away_team: "Saudi Arabia",  venue: "SoFi Stadium",          city: "Los Angeles", stage: "Group H", group_name: "H", status: "NS" },
  { fixture_id: 900046, match_date: "2026-06-21", kickoff_at: "2026-06-21T04:00:00Z", home_team: "Cape Verde",  away_team: "Uruguay",       venue: "Arrowhead Stadium",     city: "Kansas City", stage: "Group H", group_name: "H", status: "NS" },
  { fixture_id: 900047, match_date: "2026-06-26", kickoff_at: "2026-06-26T17:00:00Z", home_team: "Spain",       away_team: "Uruguay",       venue: "MetLife Stadium",       city: "East Rutherford", stage: "Group H", group_name: "H", status: "NS" },
  { fixture_id: 900048, match_date: "2026-06-26", kickoff_at: "2026-06-26T17:00:00Z", home_team: "Cape Verde",  away_team: "Saudi Arabia",  venue: "Levi's Stadium",        city: "Santa Clara", stage: "Group H", group_name: "H", status: "NS" },

  // GROUP I: France · Senegal · Iraq · Norway
  { fixture_id: 900049, match_date: "2026-06-16", kickoff_at: "2026-06-16T19:00:00Z", home_team: "France",   away_team: "Senegal",  venue: "AT&T Stadium",            city: "Arlington",    stage: "Group I", group_name: "I", status: "NS" },
  { fixture_id: 900050, match_date: "2026-06-16", kickoff_at: "2026-06-16T22:00:00Z", home_team: "Iraq",     away_team: "Norway",   venue: "Gillette Stadium",        city: "Boston",       stage: "Group I", group_name: "I", status: "NS" },
  { fixture_id: 900051, match_date: "2026-06-21", kickoff_at: "2026-06-21T19:00:00Z", home_team: "France",   away_team: "Iraq",     venue: "Mercedes-Benz Stadium",   city: "Atlanta",      stage: "Group I", group_name: "I", status: "NS" },
  { fixture_id: 900052, match_date: "2026-06-21", kickoff_at: "2026-06-21T22:00:00Z", home_team: "Senegal",  away_team: "Norway",   venue: "Lincoln Financial Field", city: "Philadelphia", stage: "Group I", group_name: "I", status: "NS" },
  { fixture_id: 900053, match_date: "2026-06-27", kickoff_at: "2026-06-27T01:00:00Z", home_team: "France",   away_team: "Norway",   venue: "MetLife Stadium",         city: "East Rutherford", stage: "Group I", group_name: "I", status: "NS" },
  { fixture_id: 900054, match_date: "2026-06-27", kickoff_at: "2026-06-27T01:00:00Z", home_team: "Senegal",  away_team: "Iraq",     venue: "Hard Rock Stadium",       city: "Miami",        stage: "Group I", group_name: "I", status: "NS" },

  // GROUP J: Argentina · Algeria · Austria · Jordan
  { fixture_id: 900055, match_date: "2026-06-17", kickoff_at: "2026-06-17T01:00:00Z", home_team: "Argentina", away_team: "Algeria",   venue: "MetLife Stadium", city: "East Rutherford", stage: "Group J", group_name: "J", status: "NS" },
  { fixture_id: 900056, match_date: "2026-06-17", kickoff_at: "2026-06-17T04:00:00Z", home_team: "Austria",   away_team: "Jordan",    venue: "NRG Stadium",     city: "Houston",         stage: "Group J", group_name: "J", status: "NS" },
  { fixture_id: 900057, match_date: "2026-06-22", kickoff_at: "2026-06-22T01:00:00Z", home_team: "Argentina", away_team: "Austria",   venue: "Hard Rock Stadium", city: "Miami",         stage: "Group J", group_name: "J", status: "NS" },
  { fixture_id: 900058, match_date: "2026-06-22", kickoff_at: "2026-06-22T04:00:00Z", home_team: "Algeria",   away_team: "Jordan",    venue: "Lumen Field",     city: "Seattle",         stage: "Group J", group_name: "J", status: "NS" },
  { fixture_id: 900059, match_date: "2026-06-27", kickoff_at: "2026-06-27T21:00:00Z", home_team: "Argentina", away_team: "Jordan",    venue: "MetLife Stadium", city: "East Rutherford", stage: "Group J", group_name: "J", status: "NS" },
  { fixture_id: 900060, match_date: "2026-06-27", kickoff_at: "2026-06-27T21:00:00Z", home_team: "Algeria",   away_team: "Austria",   venue: "AT&T Stadium",    city: "Arlington",       stage: "Group J", group_name: "J", status: "NS" },

  // GROUP K: Portugal · DR Congo · Uzbekistan · Colombia
  { fixture_id: 900061, match_date: "2026-06-17", kickoff_at: "2026-06-17T19:00:00Z", home_team: "Portugal",   away_team: "DR Congo",    venue: "Lincoln Financial Field", city: "Philadelphia", stage: "Group K", group_name: "K", status: "NS" },
  { fixture_id: 900062, match_date: "2026-06-17", kickoff_at: "2026-06-17T22:00:00Z", home_team: "Uzbekistan", away_team: "Colombia",    venue: "Arrowhead Stadium",       city: "Kansas City",  stage: "Group K", group_name: "K", status: "NS" },
  { fixture_id: 900063, match_date: "2026-06-22", kickoff_at: "2026-06-22T19:00:00Z", home_team: "Portugal",   away_team: "Uzbekistan",  venue: "SoFi Stadium",            city: "Los Angeles",  stage: "Group K", group_name: "K", status: "NS" },
  { fixture_id: 900064, match_date: "2026-06-22", kickoff_at: "2026-06-22T22:00:00Z", home_team: "DR Congo",   away_team: "Colombia",    venue: "NRG Stadium",             city: "Houston",      stage: "Group K", group_name: "K", status: "NS" },
  { fixture_id: 900065, match_date: "2026-06-27", kickoff_at: "2026-06-27T17:00:00Z", home_team: "Portugal",   away_team: "Colombia",    venue: "MetLife Stadium",         city: "East Rutherford", stage: "Group K", group_name: "K", status: "NS" },
  { fixture_id: 900066, match_date: "2026-06-27", kickoff_at: "2026-06-27T17:00:00Z", home_team: "DR Congo",   away_team: "Uzbekistan",  venue: "Mercedes-Benz Stadium",   city: "Atlanta",      stage: "Group K", group_name: "K", status: "NS" },

  // GROUP L: England · Croatia · Ghana · Panama
  { fixture_id: 900067, match_date: "2026-06-18", kickoff_at: "2026-06-18T01:00:00Z", home_team: "England", away_team: "Croatia",  venue: "Levi's Stadium",   city: "Santa Clara", stage: "Group L", group_name: "L", status: "NS" },
  { fixture_id: 900068, match_date: "2026-06-18", kickoff_at: "2026-06-18T04:00:00Z", home_team: "Ghana",   away_team: "Panama",   venue: "Lumen Field",      city: "Seattle",     stage: "Group L", group_name: "L", status: "NS" },
  { fixture_id: 900069, match_date: "2026-06-23", kickoff_at: "2026-06-23T01:00:00Z", home_team: "England", away_team: "Ghana",    venue: "AT&T Stadium",     city: "Arlington",   stage: "Group L", group_name: "L", status: "NS" },
  { fixture_id: 900070, match_date: "2026-06-23", kickoff_at: "2026-06-23T04:00:00Z", home_team: "Croatia", away_team: "Panama",   venue: "Gillette Stadium", city: "Boston",      stage: "Group L", group_name: "L", status: "NS" },
  { fixture_id: 900071, match_date: "2026-06-28", kickoff_at: "2026-06-28T01:00:00Z", home_team: "England", away_team: "Panama",   venue: "MetLife Stadium",  city: "East Rutherford", stage: "Group L", group_name: "L", status: "NS" },
  { fixture_id: 900072, match_date: "2026-06-28", kickoff_at: "2026-06-28T01:00:00Z", home_team: "Croatia", away_team: "Ghana",    venue: "Hard Rock Stadium",city: "Miami",       stage: "Group L", group_name: "L", status: "NS" },

  // ROUND OF 32 (June 29 – July 4)
  { fixture_id: 900073, match_date: "2026-06-29", kickoff_at: "2026-06-29T19:00:00Z", home_team: "TBD 1A",    away_team: "TBD 3DEF",  venue: "MetLife Stadium",         city: "East Rutherford", stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900074, match_date: "2026-06-29", kickoff_at: "2026-06-29T23:00:00Z", home_team: "TBD 1C",    away_team: "TBD 3ABC",  venue: "Hard Rock Stadium",       city: "Miami",           stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900075, match_date: "2026-06-30", kickoff_at: "2026-06-30T19:00:00Z", home_team: "TBD 1B",    away_team: "TBD 2A",    venue: "AT&T Stadium",            city: "Arlington",       stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900076, match_date: "2026-06-30", kickoff_at: "2026-06-30T23:00:00Z", home_team: "TBD 1D",    away_team: "TBD 2C",    venue: "SoFi Stadium",            city: "Los Angeles",     stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900077, match_date: "2026-07-01", kickoff_at: "2026-07-01T19:00:00Z", home_team: "TBD 1E",    away_team: "TBD 3GHI",  venue: "Mercedes-Benz Stadium",   city: "Atlanta",         stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900078, match_date: "2026-07-01", kickoff_at: "2026-07-01T23:00:00Z", home_team: "TBD 1G",    away_team: "TBD 3EFJ",  venue: "Lumen Field",             city: "Seattle",         stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900079, match_date: "2026-07-02", kickoff_at: "2026-07-02T19:00:00Z", home_team: "TBD 1F",    away_team: "TBD 2E",    venue: "Gillette Stadium",        city: "Boston",          stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900080, match_date: "2026-07-02", kickoff_at: "2026-07-02T23:00:00Z", home_team: "TBD 1H",    away_team: "TBD 2G",    venue: "NRG Stadium",             city: "Houston",         stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900081, match_date: "2026-07-02", kickoff_at: "2026-07-02T19:00:00Z", home_team: "TBD 1I",    away_team: "TBD 3JKL",  venue: "Lincoln Financial Field", city: "Philadelphia",    stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900082, match_date: "2026-07-02", kickoff_at: "2026-07-02T23:00:00Z", home_team: "TBD 1K",    away_team: "TBD 3BCD",  venue: "Arrowhead Stadium",       city: "Kansas City",     stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900083, match_date: "2026-07-03", kickoff_at: "2026-07-03T19:00:00Z", home_team: "TBD 1J",    away_team: "TBD 2I",    venue: "Levi's Stadium",          city: "Santa Clara",     stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900084, match_date: "2026-07-03", kickoff_at: "2026-07-03T23:00:00Z", home_team: "TBD 1L",    away_team: "TBD 2K",    venue: "BC Place",                city: "Vancouver",       stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900085, match_date: "2026-07-03", kickoff_at: "2026-07-03T19:00:00Z", home_team: "TBD 2B",    away_team: "TBD 2D",    venue: "BMO Field",               city: "Toronto",         stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900086, match_date: "2026-07-03", kickoff_at: "2026-07-03T23:00:00Z", home_team: "TBD 2F",    away_team: "TBD 2H",    venue: "Estadio Azteca",          city: "Mexico City",     stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900087, match_date: "2026-07-04", kickoff_at: "2026-07-04T19:00:00Z", home_team: "TBD 2J",    away_team: "TBD 2L",    venue: "Estadio BBVA",            city: "Monterrey",       stage: "R32", group_name: null, status: "NS" },
  { fixture_id: 900088, match_date: "2026-07-04", kickoff_at: "2026-07-04T23:00:00Z", home_team: "TBD 3AGH",  away_team: "TBD 3BEF",  venue: "Estadio Akron",           city: "Guadalajara",     stage: "R32", group_name: null, status: "NS" },

  // ROUND OF 16 (July 5–8)
  { fixture_id: 900089, match_date: "2026-07-05", kickoff_at: "2026-07-05T19:00:00Z", home_team: "TBD R32W1",  away_team: "TBD R32W2",  venue: "MetLife Stadium",       city: "East Rutherford", stage: "R16", group_name: null, status: "NS" },
  { fixture_id: 900090, match_date: "2026-07-05", kickoff_at: "2026-07-05T23:00:00Z", home_team: "TBD R32W3",  away_team: "TBD R32W4",  venue: "AT&T Stadium",          city: "Arlington",       stage: "R16", group_name: null, status: "NS" },
  { fixture_id: 900091, match_date: "2026-07-06", kickoff_at: "2026-07-06T19:00:00Z", home_team: "TBD R32W5",  away_team: "TBD R32W6",  venue: "SoFi Stadium",          city: "Los Angeles",     stage: "R16", group_name: null, status: "NS" },
  { fixture_id: 900092, match_date: "2026-07-06", kickoff_at: "2026-07-06T23:00:00Z", home_team: "TBD R32W7",  away_team: "TBD R32W8",  venue: "Mercedes-Benz Stadium", city: "Atlanta",         stage: "R16", group_name: null, status: "NS" },
  { fixture_id: 900093, match_date: "2026-07-07", kickoff_at: "2026-07-07T19:00:00Z", home_team: "TBD R32W9",  away_team: "TBD R32W10", venue: "NRG Stadium",           city: "Houston",         stage: "R16", group_name: null, status: "NS" },
  { fixture_id: 900094, match_date: "2026-07-07", kickoff_at: "2026-07-07T23:00:00Z", home_team: "TBD R32W11", away_team: "TBD R32W12", venue: "Hard Rock Stadium",     city: "Miami",           stage: "R16", group_name: null, status: "NS" },
  { fixture_id: 900095, match_date: "2026-07-08", kickoff_at: "2026-07-08T19:00:00Z", home_team: "TBD R32W13", away_team: "TBD R32W14", venue: "Gillette Stadium",      city: "Boston",          stage: "R16", group_name: null, status: "NS" },
  { fixture_id: 900096, match_date: "2026-07-08", kickoff_at: "2026-07-08T23:00:00Z", home_team: "TBD R32W15", away_team: "TBD R32W16", venue: "Arrowhead Stadium",     city: "Kansas City",     stage: "R16", group_name: null, status: "NS" },

  // QUARTERFINALS (July 10–11)
  { fixture_id: 900097, match_date: "2026-07-10", kickoff_at: "2026-07-10T19:00:00Z", home_team: "TBD R16W1", away_team: "TBD R16W2", venue: "Gillette Stadium",  city: "Boston",      stage: "QF", group_name: null, status: "NS" },
  { fixture_id: 900098, match_date: "2026-07-10", kickoff_at: "2026-07-10T23:00:00Z", home_team: "TBD R16W3", away_team: "TBD R16W4", venue: "SoFi Stadium",      city: "Los Angeles", stage: "QF", group_name: null, status: "NS" },
  { fixture_id: 900099, match_date: "2026-07-11", kickoff_at: "2026-07-11T19:00:00Z", home_team: "TBD R16W5", away_team: "TBD R16W6", venue: "Hard Rock Stadium", city: "Miami",       stage: "QF", group_name: null, status: "NS" },
  { fixture_id: 900100, match_date: "2026-07-11", kickoff_at: "2026-07-11T23:00:00Z", home_team: "TBD R16W7", away_team: "TBD R16W8", venue: "Arrowhead Stadium", city: "Kansas City", stage: "QF", group_name: null, status: "NS" },

  // SEMIFINALS (July 14–15)
  { fixture_id: 900101, match_date: "2026-07-14", kickoff_at: "2026-07-14T23:00:00Z", home_team: "TBD QFW1", away_team: "TBD QFW2", venue: "AT&T Stadium",          city: "Arlington", stage: "SF",    group_name: null, status: "NS" },
  { fixture_id: 900102, match_date: "2026-07-15", kickoff_at: "2026-07-15T23:00:00Z", home_team: "TBD QFW3", away_team: "TBD QFW4", venue: "Mercedes-Benz Stadium", city: "Atlanta",   stage: "SF",    group_name: null, status: "NS" },

  // THIRD PLACE (July 18)
  { fixture_id: 900103, match_date: "2026-07-18", kickoff_at: "2026-07-18T21:00:00Z", home_team: "TBD SFL1", away_team: "TBD SFL2", venue: "Hard Rock Stadium", city: "Miami",          stage: "3rd",   group_name: null, status: "NS" },

  // FINAL (July 19)
  { fixture_id: 900104, match_date: "2026-07-19", kickoff_at: "2026-07-19T19:00:00Z", home_team: "TBD SFW1", away_team: "TBD SFW2", venue: "MetLife Stadium",   city: "East Rutherford",stage: "Final", group_name: null, status: "NS" },
];

async function main() {
  await runSchema();

  console.log(`\n[2/2] Seeding ${FIXTURES.length} WC 2026 fixtures...`);

  // Upsert in batches of 50 to avoid payload limits
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < FIXTURES.length; i += BATCH) {
    const batch = FIXTURES.slice(i, i + BATCH);
    const { error } = await supabase
      .from("wc_fixtures")
      .upsert(batch, { onConflict: "fixture_id" });

    if (error) {
      console.error(`  Batch ${i}–${i + batch.length - 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  Inserted rows ${i + 1}–${i + batch.length}`);
    }
  }

  console.log(`\nDone — ${inserted}/${FIXTURES.length} fixtures seeded.`);

  // Quick summary by stage
  const groups  = FIXTURES.filter(f => f.stage.startsWith("Group")).length;
  const knockout= FIXTURES.length - groups;
  console.log(`  Group stage: ${groups} matches (all teams known)`);
  console.log(`  Knockout:    ${knockout} matches (teams TBD after group stage)`);
  console.log(`\nOpening match: Mexico vs South Africa · June 11 · Estadio Azteca, Mexico City`);
  console.log(`Final:          July 19 · MetLife Stadium, East Rutherford, NJ`);
}

main().catch((err) => { console.error(err); process.exit(1); });
