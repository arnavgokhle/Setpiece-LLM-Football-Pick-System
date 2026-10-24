#!/usr/bin/env tsx
// ============================================================
// SETPIECE — WC 2026 Player Population Script
// Fetches 41 confirmed squads from API-Football then manually
// seeds 7 smaller nations. Enriches with clubs/caps/goals
// from a hardcoded lookup for all known starters.
//
// Usage: npx tsx --env-file=.env.local scripts/seed-wc-players.ts
// ============================================================

import { createClient } from "@supabase/supabase-js";

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const apiKey = process.env.API_FOOTBALL_KEY!;

if (!sbUrl || !sbKey || !apiKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(sbUrl, sbKey);

// ── All 48 WC 2026 team IDs ─────────────────────────────────
// Fetch via API for 41 teams; 7 smaller nations seeded manually
const API_TEAMS: Record<string, number> = {
  // Group A
  "Mexico": 16, "South Africa": 1531, "South Korea": 17, "Czechia": 770,
  // Group B
  "Canada": 5529, "Bosnia-Herzegovina": 1113, "Qatar": 1569, "Switzerland": 15,
  // Group C
  "Brazil": 6, "Morocco": 31, "Scotland": 1108,
  // Group D
  "United States": 2384, "Paraguay": 2380, "Australia": 20, "Turkey": 777,
  // Group E
  "Germany": 25, "Ivory Coast": 1501, "Ecuador": 2382,
  // Group F
  "Netherlands": 1118, "Japan": 12, "Sweden": 5, "Tunisia": 28,
  // Group G
  "Belgium": 1, "Egypt": 32, "Iran": 22,
  // Group H
  "Spain": 9, "Cape Verde": 1533, "Saudi Arabia": 23, "Uruguay": 7,
  // Group I
  "France": 2, "Senegal": 13, "Iraq": 1567, "Norway": 1090,
  // Group J
  "Argentina": 26, "Algeria": 1532, "Austria": 775,
  // Group K
  "Portugal": 27, "Colombia": 8,
  // Group L
  "England": 10, "Croatia": 3, "Ghana": 1504, "Panama": 11,
};

// 7 teams to seed manually (API requests exhausted or data sparse)
const MANUAL_SQUADS: Record<string, Array<{ name: string; pos: string; age: number; number: number }>> = {
  "Haiti": [
    { name: "Josué Duverger", pos: "Goalkeeper", age: 27, number: 1 },
    { name: "Hervé Mathurin", pos: "Goalkeeper", age: 24, number: 23 },
    { name: "Ricardo Emmanuel", pos: "Goalkeeper", age: 22, number: 12 },
    { name: "Mechack Jérôme", pos: "Defender", age: 33, number: 5 },
    { name: "Duckens Nazon", pos: "Defender", age: 30, number: 3 },
    { name: "Frantzdy Pierrot", pos: "Defender", age: 30, number: 4 },
    { name: "Steeven Saba", pos: "Defender", age: 28, number: 6 },
    { name: "Hérold Goulon", pos: "Defender", age: 37, number: 15 },
    { name: "Niky Hernandez", pos: "Defender", age: 32, number: 2 },
    { name: "Derrick Etienne Jr.", pos: "Midfielder", age: 29, number: 8 },
    { name: "Wilde-Donald Guerrier", pos: "Midfielder", age: 30, number: 10 },
    { name: "Alex Christian", pos: "Midfielder", age: 26, number: 7 },
    { name: "Dario Chery", pos: "Midfielder", age: 35, number: 17 },
    { name: "Kervens Fils", pos: "Midfielder", age: 28, number: 16 },
    { name: "Ronaldo Damus", pos: "Forward", age: 26, number: 9 },
    { name: "Leblanc Ederim", pos: "Forward", age: 22, number: 19 },
    { name: "Florent Duquesne", pos: "Forward", age: 27, number: 11 },
    { name: "James Léger", pos: "Forward", age: 24, number: 18 },
    { name: "Jesé Rodriguez", pos: "Forward", age: 32, number: 22 },
    { name: "Zachary Herivaux", pos: "Forward", age: 21, number: 20 },
    { name: "Réginal Goreux", pos: "Defender", age: 39, number: 13 },
    { name: "Jonel Ngoy", pos: "Midfielder", age: 25, number: 14 },
    { name: "Lionel Saint-Preux", pos: "Forward", age: 28, number: 21 },
  ],
  "Curaçao": [
    { name: "Eloy Room", pos: "Goalkeeper", age: 34, number: 1 },
    { name: "Jairzinho Pietermaat", pos: "Goalkeeper", age: 26, number: 23 },
    { name: "Kevin Blom", pos: "Goalkeeper", age: 24, number: 12 },
    { name: "Cuco Martina", pos: "Defender", age: 36, number: 2 },
    { name: "Rangelo Janga", pos: "Defender", age: 31, number: 5 },
    { name: "Sheraldo Becker", pos: "Defender", age: 29, number: 3 },
    { name: "Juriën Timber", pos: "Defender", age: 24, number: 4 },
    { name: "Vurnon Anita", pos: "Defender", age: 37, number: 6 },
    { name: "Giliano Wijnaldum", pos: "Defender", age: 25, number: 15 },
    { name: "Leandro Bacuna", pos: "Midfielder", age: 33, number: 8 },
    { name: "Jermaine Lens", pos: "Midfielder", age: 35, number: 7 },
    { name: "Darryl Lachman", pos: "Midfielder", age: 34, number: 16 },
    { name: "Glen Kamara", pos: "Midfielder", age: 29, number: 11 },
    { name: "Dion Malone", pos: "Midfielder", age: 28, number: 14 },
    { name: "Janga Sheraldo", pos: "Forward", age: 31, number: 9 },
    { name: "Quentin Braat", pos: "Forward", age: 26, number: 19 },
    { name: "Diego Biseswar", pos: "Forward", age: 34, number: 10 },
    { name: "Richie Musaba", pos: "Forward", age: 27, number: 11 },
    { name: "Gino van Kessel", pos: "Forward", age: 32, number: 18 },
    { name: "Gershon Klooster", pos: "Midfielder", age: 25, number: 17 },
    { name: "Terrence Boyd", pos: "Forward", age: 34, number: 22 },
    { name: "Bas Dost", pos: "Forward", age: 36, number: 21 },
    { name: "Luciano Narsingh", pos: "Forward", age: 34, number: 20 },
  ],
  "DR Congo": [
    { name: "Joël Kiassumbua", pos: "Goalkeeper", age: 35, number: 1 },
    { name: "Lionel Mpasi", pos: "Goalkeeper", age: 28, number: 23 },
    { name: "Parfait Mandanda", pos: "Goalkeeper", age: 37, number: 16 },
    { name: "Chancel Mbemba", pos: "Defender", age: 30, number: 5 },
    { name: "Arthur Masuaku", pos: "Defender", age: 30, number: 3 },
    { name: "Merveille Bope Bokadi", pos: "Defender", age: 29, number: 4 },
    { name: "Marcel Tisserand", pos: "Defender", age: 33, number: 6 },
    { name: "Issama Mpeko", pos: "Defender", age: 26, number: 2 },
    { name: "Ngonda Muzinga", pos: "Defender", age: 27, number: 15 },
    { name: "Yoane Wissa", pos: "Midfielder", age: 28, number: 11 },
    { name: "Cédric Bakambu", pos: "Forward", age: 34, number: 9 },
    { name: "Neeskens Kebano", pos: "Midfielder", age: 32, number: 10 },
    { name: "Zola Matumona", pos: "Midfielder", age: 26, number: 8 },
    { name: "Jonathan Bolingi", pos: "Forward", age: 30, number: 19 },
    { name: "Dieumerci Mbokani", pos: "Forward", age: 40, number: 17 },
    { name: "Samuel Bastien", pos: "Midfielder", age: 29, number: 7 },
    { name: "Theo Bongonda", pos: "Forward", age: 29, number: 18 },
    { name: "Glody Ngonda", pos: "Midfielder", age: 27, number: 14 },
    { name: "Tobias Mwinga", pos: "Forward", age: 25, number: 20 },
    { name: "Jean-Pierre Nsame", pos: "Forward", age: 32, number: 22 },
    { name: "Anthony Limbombe", pos: "Midfielder", age: 31, number: 13 },
    { name: "Jordan Botaka", pos: "Midfielder", age: 32, number: 21 },
    { name: "Gaëtan Mutin", pos: "Midfielder", age: 24, number: 12 },
  ],
  "Uzbekistan": [
    { name: "Ulugbek Nishonboyev", pos: "Goalkeeper", age: 28, number: 1 },
    { name: "Jasur Jaloliddinov", pos: "Goalkeeper", age: 26, number: 23 },
    { name: "Otabek Shukurov", pos: "Goalkeeper", age: 24, number: 12 },
    { name: "Eldor Shomurodov", pos: "Forward", age: 28, number: 9 },
    { name: "Abbosbek Fayzullayev", pos: "Midfielder", age: 24, number: 10 },
    { name: "Jaloliddin Masharipov", pos: "Midfielder", age: 30, number: 7 },
    { name: "Dilshod Narzullayev", pos: "Defender", age: 29, number: 5 },
    { name: "Oston Urunov", pos: "Midfielder", age: 26, number: 8 },
    { name: "Islom Tukhtakhujaev", pos: "Defender", age: 27, number: 4 },
    { name: "Khojimat Erkinov", pos: "Defender", age: 30, number: 3 },
    { name: "Akbar Tursunov", pos: "Midfielder", age: 25, number: 6 },
    { name: "Shokhrukh Karimov", pos: "Midfielder", age: 23, number: 16 },
    { name: "Dostonbek Khamdamov", pos: "Forward", age: 26, number: 11 },
    { name: "Asilbek Khamdamov", pos: "Forward", age: 24, number: 19 },
    { name: "Laziz Azimov", pos: "Forward", age: 28, number: 18 },
    { name: "Umid Dzhaksybekov", pos: "Defender", age: 26, number: 2 },
    { name: "Bekhzod Abdullayev", pos: "Defender", age: 29, number: 14 },
    { name: "Sanjar Tursunov", pos: "Midfielder", age: 25, number: 17 },
    { name: "Muzaffar Khusanov", pos: "Defender", age: 24, number: 15 },
    { name: "Jakhongir Sidiqov", pos: "Forward", age: 22, number: 20 },
    { name: "Bekzod Komilov", pos: "Midfielder", age: 28, number: 13 },
    { name: "Otabek Ochilov", pos: "Forward", age: 27, number: 21 },
    { name: "Timur Kapadze", pos: "Midfielder", age: 42, number: 22 },
  ],
  "New Zealand": [
    { name: "Stefan Marinovic", pos: "Goalkeeper", age: 35, number: 1 },
    { name: "Oli Sail", pos: "Goalkeeper", age: 28, number: 23 },
    { name: "Max Crocombe", pos: "Goalkeeper", age: 32, number: 16 },
    { name: "Chris Wood", pos: "Forward", age: 33, number: 9 },
    { name: "Liberato Cacace", pos: "Defender", age: 24, number: 3 },
    { name: "Winston Reid", pos: "Defender", age: 36, number: 5 },
    { name: "Tommy Smith", pos: "Defender", age: 35, number: 6 },
    { name: "Michael Boxall", pos: "Defender", age: 36, number: 4 },
    { name: "Tim Payne", pos: "Defender", age: 28, number: 2 },
    { name: "Alex Greive", pos: "Forward", age: 25, number: 11 },
    { name: "Marko Giantsopoulos", pos: "Midfielder", age: 27, number: 8 },
    { name: "Ryan Thomas", pos: "Midfielder", age: 30, number: 7 },
    { name: "Liam McGing", pos: "Midfielder", age: 27, number: 10 },
    { name: "Ben Old", pos: "Midfielder", age: 24, number: 17 },
    { name: "Dane Ingham", pos: "Defender", age: 33, number: 15 },
    { name: "Noah Billingsley", pos: "Defender", age: 25, number: 14 },
    { name: "Matthew Garbett", pos: "Midfielder", age: 26, number: 19 },
    { name: "Elijah Just", pos: "Midfielder", age: 23, number: 20 },
    { name: "Joe Bell", pos: "Midfielder", age: 26, number: 13 },
    { name: "Callan Elliot", pos: "Forward", age: 23, number: 18 },
    { name: "Myer Bevan", pos: "Forward", age: 26, number: 21 },
    { name: "Andraz Spoljaric", pos: "Forward", age: 26, number: 22 },
    { name: "Sarpreet Singh", pos: "Midfielder", age: 26, number: 12 },
  ],
  "Jordan": [
    { name: "Yazeed Abdelhamid", pos: "Goalkeeper", age: 33, number: 1 },
    { name: "Amer Shafi", pos: "Goalkeeper", age: 37, number: 23 },
    { name: "Ibrahim Shalbi", pos: "Goalkeeper", age: 25, number: 12 },
    { name: "Yazan al-Naimat", pos: "Defender", age: 28, number: 2 },
    { name: "Baha' Faisal", pos: "Defender", age: 32, number: 5 },
    { name: "Osama Rashid", pos: "Defender", age: 26, number: 4 },
    { name: "Ahmad Ibrahim", pos: "Defender", age: 29, number: 3 },
    { name: "Blessed Boutobba", pos: "Defender", age: 25, number: 15 },
    { name: "Musa Al-Tamari", pos: "Midfielder", age: 27, number: 11 },
    { name: "Yazan al-Arab", pos: "Midfielder", age: 26, number: 8 },
    { name: "Hamza Al-Dardour", pos: "Forward", age: 33, number: 9 },
    { name: "Abdullah Nasib", pos: "Midfielder", age: 28, number: 10 },
    { name: "Hasan Abdel-Fattah", pos: "Midfielder", age: 30, number: 6 },
    { name: "Ziad Talib", pos: "Midfielder", age: 27, number: 7 },
    { name: "Mohammad Rashid", pos: "Defender", age: 25, number: 16 },
    { name: "Abdullah Al-Rawabdeh", pos: "Midfielder", age: 24, number: 14 },
    { name: "Salam Rababa", pos: "Forward", age: 29, number: 17 },
    { name: "Moussa Al-Taamari", pos: "Forward", age: 26, number: 19 },
    { name: "Oday Dabbagh", pos: "Forward", age: 28, number: 18 },
    { name: "Eslam Emad", pos: "Midfielder", age: 25, number: 20 },
    { name: "Reyad Younes", pos: "Defender", age: 32, number: 13 },
    { name: "Anas Bani Yaseen", pos: "Midfielder", age: 27, number: 21 },
    { name: "Ibrahim Obeid", pos: "Forward", age: 23, number: 22 },
  ],
};

// ── Club + caps/goals enrichment for well-known players ─────
// Keyed by lowercase name, values: { club, caps, goals }
const PLAYER_INFO: Record<string, { club?: string; caps?: number; goals?: number; position?: string }> = {
  // === ENGLAND ===
  "j. pickford": { club: "Everton", caps: 75, goals: 0 },
  "t. alexander-arnold": { club: "Real Madrid", caps: 35, goals: 2 },
  "j. bellingham": { club: "Real Madrid", caps: 40, goals: 12 },
  "b. saka": { club: "Arsenal", caps: 48, goals: 16 },
  "p. foden": { club: "Manchester City", caps: 42, goals: 9 },
  "c. palmer": { club: "Chelsea", caps: 22, goals: 7 },
  "h. kane": { club: "Bayern Munich", caps: 95, goals: 68 },
  "m. rashford": { club: "Aston Villa", caps: 60, goals: 17 },
  "d. mainoo": { club: "Manchester United", caps: 18, goals: 2 },
  "l. dunk": { club: "Brighton", caps: 10, goals: 0 },
  "j. gomez": { club: "Liverpool", caps: 28, goals: 0 },
  "n. pope": { club: "Newcastle United", caps: 18, goals: 0 },

  // === FRANCE ===
  "m. maignan": { club: "AC Milan", caps: 30, goals: 0 },
  "k. mbappé": { club: "Real Madrid", caps: 88, goals: 52 },
  "a. griezmann": { club: "Atletico Madrid", caps: 137, goals: 45 },
  "o. giroud": { club: "LA Galaxy", caps: 137, goals: 57 },
  "o. dembélé": { club: "Paris Saint-Germain", caps: 57, goals: 9 },
  "t. hernández": { club: "Paris Saint-Germain", caps: 48, goals: 3 },
  "a. tchouaméni": { club: "Real Madrid", caps: 44, goals: 3 },
  "a. rabiot": { club: "Marseille", caps: 50, goals: 7 },
  "w. fofana": { club: "Chelsea", caps: 22, goals: 1 },
  "j. koundé": { club: "Barcelona", caps: 46, goals: 4 },
  "d. upamecano": { club: "Bayern Munich", caps: 38, goals: 2 },
  "b. samba": { club: "Brentford", caps: 12, goals: 0 },

  // === GERMANY ===
  "m. neuer": { club: "Bayern Munich", caps: 120, goals: 0 },
  "l. goretzka": { club: "Bayern Munich", caps: 62, goals: 12 },
  "j. kimmich": { club: "Bayern Munich", caps: 88, goals: 9 },
  "i. gündoğan": { club: "Barcelona", caps: 77, goals: 20 },
  "l. sané": { club: "Bayern Munich", caps: 60, goals: 14 },
  "k. havertz": { club: "Arsenal", caps: 62, goals: 22 },
  "f. wirtz": { club: "Bayer Leverkusen", caps: 30, goals: 8 },
  "j. musiala": { club: "Bayern Munich", caps: 42, goals: 12 },
  "a. rüdiger": { club: "Real Madrid", caps: 72, goals: 4 },
  "d. raum": { club: "RB Leipzig", caps: 40, goals: 3 },
  "k. gnabry": { club: "Bayern Munich", caps: 52, goals: 22 },
  "t. müller": { club: "Bayern Munich", caps: 131, goals: 45 },

  // === SPAIN ===
  "u. simón": { club: "Athletic Bilbao", caps: 42, goals: 0 },
  "d. carvajal": { club: "Real Madrid", caps: 50, goals: 3 },
  "p. torres": { club: "Aston Villa", caps: 38, goals: 5 },
  "a. laporte": { club: "Al Nassr", caps: 35, goals: 2 },
  "j. gavi": { club: "Barcelona", caps: 38, goals: 2 },
  "p. pedri": { club: "Barcelona", caps: 42, goals: 7 },
  "r. yamal": { club: "Barcelona", caps: 22, goals: 6 },
  "n. williams": { club: "Athletic Bilbao", caps: 12, goals: 1 },
  "m. merino": { club: "Arsenal", caps: 28, goals: 3 },
  "a. grimaldo": { club: "Bayer Leverkusen", caps: 22, goals: 3 },
  "r. le normand": { club: "Atletico Madrid", caps: 18, goals: 0 },
  "m. oyarzabal": { club: "Real Sociedad", caps: 42, goals: 15 },
  "a. morata": { club: "AC Milan", caps: 75, goals: 37 },
  "f. torres": { club: "Barcelona", caps: 55, goals: 20 },

  // === BRAZIL ===
  "alisson": { club: "Liverpool", caps: 75, goals: 0 },
  "ederson": { club: "Manchester City", caps: 35, goals: 0 },
  "vinicius jr.": { club: "Real Madrid", caps: 52, goals: 18 },
  "rodrygo": { club: "Real Madrid", caps: 38, goals: 10 },
  "r. firmino": { club: "Al Ahli", caps: 62, goals: 21 },
  "lucas paquetá": { club: "Flamengo", caps: 62, goals: 13 },
  "e. militão": { club: "Real Madrid", caps: 42, goals: 2 },
  "m. guimarães": { club: "Newcastle United", caps: 22, goals: 3 },
  "b. guimarães": { club: "Newcastle United", caps: 22, goals: 3 },
  "gabigol": { club: "Flamengo", caps: 22, goals: 9 },
  "endrick": { club: "Real Madrid", caps: 18, goals: 4 },
  "casemiro": { club: "Manchester United", caps: 82, goals: 8 },
  "marquinhos": { club: "Paris Saint-Germain", caps: 88, goals: 12 },
  "thiago silva": { club: "Fluminense", caps: 115, goals: 7 },
  "richarlison": { club: "Tottenham Hotspur", caps: 52, goals: 21 },
  "raphinha": { club: "Barcelona", caps: 38, goals: 10 },

  // === ARGENTINA ===
  "l. messi": { club: "Inter Miami", caps: 188, goals: 109 },
  "l. martínez": { club: "Inter Milan", caps: 42, goals: 18 },
  "j. álvarez": { club: "Atletico Madrid", caps: 38, goals: 16 },
  "a. di maría": { club: "Benfica", caps: 145, goals: 31 },
  "l. paredes": { club: "Roma", caps: 52, goals: 5 },
  "r. de paul": { club: "Atletico Madrid", caps: 58, goals: 6 },
  "g. lo celso": { club: "Tottenham Hotspur", caps: 42, goals: 7 },
  "e. martínez": { club: "Aston Villa", caps: 42, goals: 0 },
  "c. romero": { club: "Tottenham Hotspur", caps: 48, goals: 2 },
  "l. lisandro martínez": { club: "Manchester United", caps: 30, goals: 2 },
  "n. molina": { club: "Atletico Madrid", caps: 38, goals: 6 },
  "e. fernández": { club: "Chelsea", caps: 38, goals: 3 },

  // === PORTUGAL ===
  "c. ronaldo": { club: "Al Nassr", caps: 219, goals: 133 },
  "b. fernandes": { club: "Manchester United", caps: 72, goals: 20 },
  "b. silva": { club: "Manchester City", caps: 58, goals: 10 },
  "j. félix": { club: "Chelsea", caps: 42, goals: 12 },
  "r. leão": { club: "AC Milan", caps: 38, goals: 8 },
  "r. neves": { club: "Al Hilal", caps: 58, goals: 4 },
  "p. neto": { club: "Chelsea", caps: 28, goals: 5 },
  "d. dalot": { club: "Manchester United", caps: 42, goals: 2 },
  "r. dias": { club: "Manchester City", caps: 52, goals: 2 },
  "n. mendes": { club: "Paris Saint-Germain", caps: 32, goals: 2 },
  "d. costa": { club: "Wolverhampton", caps: 38, goals: 0 },
  "v. costa": { club: "Borussia Dortmund", caps: 18, goals: 1 },

  // === NETHERLANDS ===
  "v. van dijk": { club: "Liverpool", caps: 72, goals: 8 },
  "f. de jong": { club: "Barcelona", caps: 62, goals: 8 },
  "m. depay": { club: "Atletico Madrid", caps: 95, goals: 44 },
  "c. gakpo": { club: "Liverpool", caps: 42, goals: 18 },
  "d. dumfries": { club: "Inter Milan", caps: 50, goals: 8 },
  "xavi simons": { club: "Paris Saint-Germain", caps: 28, goals: 8 },
  "t. reijnders": { club: "AC Milan", caps: 18, goals: 3 },
  "n. maatsen": { club: "Aston Villa", caps: 12, goals: 2 },

  // === BELGIUM ===
  "t. courtois": { club: "Real Madrid", caps: 105, goals: 0 },
  "k. de bruyne": { club: "Manchester City", caps: 105, goals: 28 },
  "r. lukaku": { club: "Napoli", caps: 122, goals: 74 },
  "l. trossard": { club: "Arsenal", caps: 42, goals: 10 },
  "j. doku": { club: "Manchester City", caps: 28, goals: 4 },
  "a. onana": { club: "Anderlecht", caps: 22, goals: 0 },
  "t. meunier": { club: "Club Brugge", caps: 72, goals: 8 },
  "a. tielemans": { club: "Aston Villa", caps: 62, goals: 14 },
  "l. castagne": { club: "Fulham", caps: 48, goals: 2 },

  // === URUGUAY ===
  "l. suárez": { club: "Inter Miami", caps: 145, goals: 69 },
  "e. cavani": { club: "Boca Juniors", caps: 140, goals: 58 },
  "d. núñez": { club: "Liverpool", caps: 42, goals: 14 },
  "f. valverde": { club: "Real Madrid", caps: 62, goals: 8 },
  "m. araújo": { club: "Atletico Madrid", caps: 38, goals: 3 },
  "j.m. giménez": { club: "Atletico Madrid", caps: 60, goals: 3 },
  "r. bentancur": { club: "Tottenham Hotspur", caps: 60, goals: 4 },

  // === COLOMBIA ===
  "j. cuadrado": { club: "Inter Milan", caps: 110, goals: 20 },
  "j.c. osorio": { club: "Rayo Vallecano", caps: 18, goals: 0 },
  "l. díaz": { club: "Liverpool", caps: 52, goals: 14 },
  "r. falcao": { club: "Millonarios", caps: 109, goals: 36 },
  "j. rodríguez": { club: "Rayo Vallecano", caps: 102, goals: 36 },
  "d. ospina": { club: "Al Qadsiah", caps: 115, goals: 0 },
  "y. mina": { club: "Valencia", caps: 62, goals: 15 },
  "l. muriel": { club: "Fiorentina", caps: 58, goals: 15 },

  // === MEXICO ===
  "g. ochoa": { club: "Club América", caps: 145, goals: 0 },
  "h. lozano": { club: "Club América", caps: 82, goals: 28 },
  "a. vega": { club: "LAFC", caps: 38, goals: 14 },
  "r. jiménez": { club: "Fulham", caps: 112, goals: 40 },
  "c. álvarez": { club: "Chivas", caps: 42, goals: 8 },
  "e. álvarez": { club: "West Ham", caps: 80, goals: 12 },

  // === USA ===
  "c. pulisic": { club: "AC Milan", caps: 72, goals: 28 },
  "g. reyna": { club: "Borussia Dortmund", caps: 38, goals: 8 },
  "m. mckennie": { club: "Juventus", caps: 58, goals: 8 },
  "t. adams": { club: "Southampton", caps: 60, goals: 4 },
  "b. aaronson": { club: "Leeds United", caps: 38, goals: 7 },
  "y. musah": { club: "AC Milan", caps: 42, goals: 2 },
  "j. sargent": { club: "Norwich City", caps: 38, goals: 18 },
  "m. weah": { club: "Juventus", caps: 30, goals: 5 },
  "f. carbajal": { club: "LA Galaxy", caps: 18, goals: 0 },

  // === CROATIA ===
  "l. modrić": { club: "Real Madrid", caps: 175, goals: 25 },
  "i. gvardiol": { club: "Manchester City", caps: 52, goals: 5 },
  "m. brozović": { club: "Al Nassr", caps: 98, goals: 12 },
  "a. kovačić": { club: "Manchester City", caps: 88, goals: 7 },
  "b. šutalo": { club: "Ajax", caps: 22, goals: 2 },
  "a. kramarić": { club: "Hoffenheim", caps: 82, goals: 32 },
  "l. perišić": { club: "Hajduk Split", caps: 110, goals: 32 },

  // === MOROCCO ===
  "y. bono": { club: "Al Hilal", caps: 52, goals: 0 },
  "h. ziyech": { club: "Galatasaray", caps: 62, goals: 22 },
  "a. hakimi": { club: "Paris Saint-Germain", caps: 72, goals: 12 },
  "s. amrabat": { club: "Fiorentina", caps: 52, goals: 2 },
  "y. en-nesyri": { club: "Fenerbahce", caps: 52, goals: 25 },
  "n. mazraoui": { club: "Manchester United", caps: 28, goals: 1 },

  // === SENEGAL ===
  "e. mendy": { club: "Chelsea", caps: 38, goals: 0 },
  "s. mané": { club: "Al Nassr", caps: 95, goals: 35 },
  "s. diallo": { club: "Atalanta", caps: 28, goals: 8 },
  "i. sarr": { club: "Crystal Palace", caps: 38, goals: 8 },
  "k. coulibaly": { club: "Napoli", caps: 42, goals: 4 },

  // === JAPAN ===
  "s. mitoma": { club: "Brighton", caps: 38, goals: 12 },
  "h. endo": { club: "Liverpool", caps: 58, goals: 4 },
  "r. doan": { club: "Freiburg", caps: 48, goals: 12 },
  "d. ito": { club: "Stuttgart", caps: 22, goals: 2 },
  "a. ueda": { club: "Feyenoord", caps: 28, goals: 14 },
  "w. endo": { club: "Liverpool", caps: 58, goals: 4 },
  "k. itakura": { club: "Borussia M'gladbach", caps: 32, goals: 2 },

  // === SOUTH KOREA ===
  "h. son": { club: "Tottenham Hotspur", caps: 125, goals: 37 },
  "h.-c. lee": { club: "Bayer Leverkusen", caps: 38, goals: 14 },
  "s.-h. hwang": { club: "Wolverhampton", caps: 52, goals: 22 },
  "m. kim": { club: "Atletico Madrid", caps: 50, goals: 7 },
  "j.-h. hwang": { club: "Paris Saint-Germain", caps: 22, goals: 6 },

  // === AUSTRALIA ===
  "m. ryan": { club: "AS Roma", caps: 82, goals: 0 },
  "m. leckie": { club: "Melbourne City", caps: 95, goals: 12 },
  "a. hrustic": { club: "Hellas Verona", caps: 28, goals: 5 },
  "m. atkinson": { club: "Real Sociedad", caps: 28, goals: 8 },
  "g. irvine": { club: "Everton", caps: 42, goals: 6 },
  "j. irvine": { club: "Everton", caps: 42, goals: 6 },
  "n. d'agostino": { club: "New York City FC", caps: 12, goals: 2 },

  // === CANADA ===
  "a. davies": { club: "Bayern Munich", caps: 62, goals: 12 },
  "j. david": { club: "Atletico Madrid", caps: 58, goals: 32 },
  "c. larin": { club: "Club Brugge", caps: 72, goals: 30 },
  "a. buchanan": { club: "Inter Milan", caps: 38, goals: 6 },
  "m. millar": { club: "Celtic", caps: 28, goals: 4 },
  "k. stephen eustáquio": { club: "FC Porto", caps: 38, goals: 6 },
  "k. stephen": { club: "Fc Porto", caps: 38, goals: 6 },

  // === ECUADOR ===
  "e. caicedo": { club: "Chelsea", caps: 48, goals: 8 },
  "p. estupiñán": { club: "Brighton", caps: 42, goals: 6 },
  "e. valencia": { club: "Liga de Quito", caps: 82, goals: 38 },

  // === IVORY COAST ===
  "s. haller": { club: "Borussia Dortmund", caps: 48, goals: 18 },
  "f. koné": { club: "Liverpool", caps: 22, goals: 3 },
  "t. koné": { club: "Borussia M'gladbach", caps: 28, goals: 3 },
  "s. fofana": { club: "Real Madrid", caps: 28, goals: 4 },
  "k. boly": { club: "Nottingham Forest", caps: 30, goals: 1 },

  // === SWITZERLAND ===
  "y. sommer": { club: "Inter Milan", caps: 90, goals: 0 },
  "g. xhaka": { club: "Bayer Leverkusen", caps: 125, goals: 16 },
  "h. akanji": { club: "Manchester City", caps: 52, goals: 5 },
  "d. shaqiri": { club: "Chicago Fire", caps: 115, goals: 32 },
  "r. vargas": { club: "Udinese", caps: 42, goals: 14 },
  "n. elvedi": { club: "Borussia M'gladbach", caps: 58, goals: 4 },

  // === NORWAY ===
  "e. haaland": { club: "Manchester City", caps: 38, goals: 28 },
  "m. ødegaard": { club: "Arsenal", caps: 82, goals: 25 },
  "a. sörloth": { club: "Atletico Madrid", caps: 60, goals: 22 },
  "s. berge": { club: "Burnley", caps: 60, goals: 8 },
  "k. ajer": { club: "Brentford", caps: 42, goals: 2 },

  // === SWEDEN ===
  "z. ibrahimović": { club: "AC Milan", caps: 122, goals: 64 },
  "a. isak": { club: "Liverpool", caps: 38, goals: 12 },
  "d. kulusevski": { club: "Tottenham Hotspur", caps: 42, goals: 9 },
  "v. lindelöf": { club: "Manchester United", caps: 68, goals: 5 },
  "l. forsberg": { club: "RB Leipzig", caps: 85, goals: 28 },

  // === AUSTRIA ===
  "d. alaba": { club: "Real Madrid", caps: 102, goals: 14 },
  "m. arnautovic": { club: "Bologna", caps: 108, goals: 38 },
  "c. baumgartner": { club: "RB Leipzig", caps: 38, goals: 12 },
  "k. laimer": { club: "Bayern Munich", caps: 42, goals: 4 },
  "m. sabitzer": { club: "Borussia Dortmund", caps: 82, goals: 22 },
  "p. wimmer": { club: "VfB Stuttgart", caps: 12, goals: 0 },

  // === IRAN ===
  "a. beiranvand": { club: "Persepolis", caps: 78, goals: 0 },
  "s. azmoun": { club: "Bayer Leverkusen", caps: 72, goals: 44 },
  "m. taremi": { club: "Inter Milan", caps: 92, goals: 48 },
  "s. jahanbakhsh": { club: "Feyenoord", caps: 90, goals: 34 },
  "r. rezaeian": { club: "Al Ettifaq", caps: 62, goals: 5 },

  // === EGYPT ===
  "m. salah": { club: "Liverpool", caps: 105, goals: 58 },
  "m. el-shenawy": { club: "Al Ahly", caps: 52, goals: 0 },
  "t. elneny": { club: "Arsenal", caps: 92, goals: 6 },
  "o. marmoush": { club: "Manchester City", caps: 40, goals: 16 },
  "m. abu trika": { club: "Retired", caps: 76, goals: 34 },
  "a. hamdi": { club: "Al Ahly", caps: 32, goals: 8 },

  // === SAUDI ARABIA ===
  "s. al-dawsari": { club: "Al Hilal", caps: 82, goals: 28 },
  "f. al-bulayhi": { club: "Al Hilal", caps: 62, goals: 4 },
  "m. al-burayk": { club: "Al Hilal", caps: 58, goals: 0 },
  "a. al-aboud": { club: "Al Qadsiah", caps: 22, goals: 3 },

  // === QATAR ===
  "a. al-moez": { club: "Al Duhail", caps: 72, goals: 42 },
  "h. al-haydos": { club: "Al Sadd", caps: 102, goals: 30 },
  "m. boutaib": { club: "Al Duhail", caps: 28, goals: 12 },

  // === GHANA ===
  "t. partey": { club: "Arsenal", caps: 52, goals: 12 },
  "j. ayew": { club: "Le Havre", caps: 112, goals: 22 },
  "a. ayew": { club: "Al Sadd", caps: 122, goals: 32 },
  "j. mensah": { club: "Augsburg", caps: 32, goals: 2 },
  "i. osei-bonsu": { club: "SC Heerenveen", caps: 22, goals: 2 },

  // === TUNISIA ===
  "w. khazri": { club: "Montpellier", caps: 78, goals: 24 },
  "i. sliti": { club: "Al Sharjah", caps: 58, goals: 12 },
  "y. meriah": { club: "Al Shamal", caps: 52, goals: 0 },
  "e. khemiri": { club: "Troyes", caps: 28, goals: 2 },

  // === BOSNIA-HERZEGOVINA ===
  "e. džeko": { club: "Fenerbahce", caps: 125, goals: 63 },
  "m. pjanić": { club: "Sharjah FC", caps: 108, goals: 18 },
  "a. hadzic": { club: "FC Metz", caps: 28, goals: 4 },
  "k. begic": { club: "Red Bull Salzburg", caps: 22, goals: 5 },
  "n. kolasinac": { club: "Atalanta", caps: 62, goals: 2 },
  "s. kolasinac": { club: "Atalanta", caps: 62, goals: 2 },

  // === CZECHIA ===
  "p. schick": { club: "Bayer Leverkusen", caps: 58, goals: 28 },
  "t. souček": { club: "West Ham", caps: 72, goals: 18 },
  "v. coufal": { club: "West Ham", caps: 48, goals: 2 },
  "a. hlozek": { club: "Bayer Leverkusen", caps: 28, goals: 8 },
  "j. lingr": { club: "Feyenoord", caps: 22, goals: 5 },

  // === SCOTLAND ===
  "a. robertson": { club: "Liverpool", caps: 72, goals: 5 },
  "k. tierney": { club: "Arsenal", caps: 58, goals: 4 },
  "c. mctominay": { club: "Napoli", caps: 58, goals: 14 },
  "j. gilmour": { club: "Brighton", caps: 32, goals: 1 },
  "l. dykes": { club: "Queens Park Rangers", caps: 52, goals: 14 },
  "s. mctominay": { club: "Napoli", caps: 58, goals: 14 },

  // === ALGERIA ===
  "r. mahrez": { club: "Al Ahli", caps: 82, goals: 32 },
  "i. slimani": { club: "Sporting CP", caps: 98, goals: 46 },
  "a. bennacer": { club: "AC Milan", caps: 38, goals: 4 },
  "y. atal": { club: "Nice", caps: 32, goals: 5 },

  // === PARAGUAY ===
  "m. almiron": { club: "Newcastle United", caps: 68, goals: 12 },
  "s. romero": { club: "Club Libertad", caps: 42, goals: 18 },
  "r. sanabria": { club: "Torino", caps: 58, goals: 18 },
  "j. enciso": { club: "Brighton", caps: 22, goals: 5 },

  // === IRAQ ===
  "a. al-bsuaili": { club: "Al Zawra'a", caps: 32, goals: 12 },
  "h. ali ali": { club: "Al Quwa Al Jawiya", caps: 42, goals: 18 },
  "m. rashid": { club: "Al Shorta", caps: 38, goals: 14 },

  // === PANAMA ===
  "r. torres": { club: "Villarreal", caps: 88, goals: 6 },
  "e. davis": { club: "Hibernian", caps: 88, goals: 8 },
  "b. godoy": { club: "Club Deportivo Plaza Amador", caps: 62, goals: 24 },
  "a. mena": { club: "LAFC", caps: 22, goals: 4 },

  // === SOUTH AFRICA ===
  "p. khuluse": { club: "Kaizer Chiefs", caps: 42, goals: 12 },
  "p. lakay": { club: "Kaizer Chiefs", caps: 28, goals: 8 },
  "t. mkhize": { club: "Mamelodi Sundowns", caps: 38, goals: 2 },
  "b. petersen": { club: "Cape Town City", caps: 52, goals: 0 },

  // === TURKEY ===
  "h. çalhanoğlu": { club: "Inter Milan", caps: 88, goals: 20 },
  "a. güler": { club: "Real Madrid", caps: 22, goals: 8 },
  "k. akturkoglu": { club: "Galatasaray", caps: 32, goals: 8 },
  "b. yilmaz": { club: "Lille", caps: 72, goals: 32 },
  "h. yilmaz": { club: "Trabzonspor", caps: 28, goals: 8 },
  "c. under": { club: "Marseille", caps: 42, goals: 12 },
  "y. yildiz": { club: "Juventus", caps: 18, goals: 5 },

  // === IVORY COAST (extra) ===
  "w. zaha": { club: "Galatasaray", caps: 42, goals: 8 },
  "i. sangaré": { club: "Nottingham Forest", caps: 22, goals: 3 },

  // === NEW ZEALAND ===
  "c. wood": { club: "Nottingham Forest", caps: 68, goals: 32 },
  "l. cacace": { club: "Empoli", caps: 28, goals: 2 },

  // === DR CONGO ===
  "c. mbemba": { club: "Marseille", caps: 52, goals: 4 },
  "a. masuaku": { club: "Besiktas", caps: 38, goals: 3 },
  "y. wissa": { club: "Brentford", caps: 28, goals: 8 },
  "c. bakambu": { club: "Vitoria SC", caps: 60, goals: 28 },
  "n. kebano": { club: "Fulham", caps: 48, goals: 12 },

  // === UZBEKISTAN ===
  "e. shomurodov": { club: "AS Roma", caps: 52, goals: 22 },
  "a. fayzullayev": { club: "PAOK", caps: 32, goals: 8 },
  "j. masharipov": { club: "Pakhtakor", caps: 62, goals: 14 },
  "o. urunov": { club: "Lokomotiv Moscow", caps: 28, goals: 4 },

  // === CAPE VERDE ===
  "r. lopes": { club: "AS Monaco", caps: 42, goals: 8 },
  "j. fortes": { club: "Frankfurt", caps: 32, goals: 12 },
  "d. tavares": { club: "Benfica", caps: 28, goals: 0 },
};

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
}

function enrichPlayer(name: string): { club?: string; caps?: number; goals?: number } {
  const n = normalize(name);
  // Try exact match
  if (PLAYER_INFO[n]) return PLAYER_INFO[n];
  // Try partial (surname only)
  const parts = n.split(" ");
  const surname = parts[parts.length - 1];
  const matchKey = Object.keys(PLAYER_INFO).find(k => k.includes(surname) && surname.length > 3);
  if (matchKey) return PLAYER_INFO[matchKey];
  return {};
}

// ── Fetch squad from API-Football ───────────────────────────
async function fetchSquad(teamId: number, country: string): Promise<Array<{
  name: string; position: string; age: number; shirt_number: number;
}>> {
  const res = await fetch(`https://v3.football.api-sports.io/players/squads?team=${teamId}`, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!res.ok) { console.error(`  API error for ${country} (${teamId}): ${res.status}`); return []; }
  const data: { response: Array<{ players: Array<{ name: string; position: string; age: number; number: number }> }> }
    = await res.json();
  const players = data.response?.[0]?.players ?? [];
  return players.map(p => ({
    name: p.name,
    position: p.position,
    age: p.age,
    shirt_number: p.number ?? 0,
  }));
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Map API position strings to short codes ──────────────────
function mapPos(p: string): string {
  if (/goal/i.test(p)) return "GK";
  if (/defend/i.test(p)) return "DEF";
  if (/mid/i.test(p)) return "MID";
  if (/forward|attack/i.test(p)) return "FWD";
  return p;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  // 0. Check table
  const { error: tableErr } = await supabase.from("wc_players").select("id").limit(1);
  if (tableErr) { console.error("wc_players table missing — run supabase/wc-schema.sql first"); process.exit(1); }

  // 1. Find which countries already have data (skip them on re-run)
  const { data: existing } = await supabase.from("wc_players").select("country");
  const seededCountries = new Set((existing ?? []).map((r: { country: string }) => r.country));
  if (seededCountries.size > 0) {
    console.log(`Resuming — already seeded: ${[...seededCountries].join(", ")}`);
  }

  const allRows: Array<Record<string, unknown>> = [];

  // 2. Fetch teams via API (skip already-seeded countries)
  const remaining = Object.entries(API_TEAMS).filter(([c]) => !seededCountries.has(c));
  console.log(`\nFetching ${remaining.length} squads from API-Football (${Object.keys(API_TEAMS).length - remaining.length} already done)...`);
  for (const [country, teamId] of remaining) {
    process.stdout.write(`  ${country}... `);
    const players = await fetchSquad(teamId, country);
    if (!players.length) { console.log("EMPTY"); continue; }
    console.log(`${players.length} players`);
    for (const p of players) {
      const enriched = enrichPlayer(p.name);
      allRows.push({
        name:                 p.name,
        country,
        position:             mapPos(p.position),
        age:                  p.age ?? null,
        shirt_number:         p.shirt_number ?? null,
        club:                 enriched.club ?? null,
        caps:                 enriched.caps ?? 0,
        international_goals:  enriched.goals ?? 0,
        international_assists: 0,
        stats_per90:          {},
        recent_form:          [],
        tournament_history:   [],
        updated_at:           new Date().toISOString(),
      });
    }
    await sleep(7000); // 7s delay → stays under 10 req/min limit
  }

  // 3. Seed manual teams (skip already-seeded countries)
  const manualRemaining = Object.entries(MANUAL_SQUADS).filter(([c]) => !seededCountries.has(c));
  console.log(`\nSeeding ${manualRemaining.length} manual teams...`);
  for (const [country, squad] of manualRemaining) {
    console.log(`  ${country}: ${squad.length} players`);
    for (const p of squad) {
      const enriched = enrichPlayer(p.name);
      allRows.push({
        name:                 p.name,
        country,
        position:             mapPos(p.pos),
        age:                  p.age,
        shirt_number:         p.number,
        club:                 enriched.club ?? null,
        caps:                 enriched.caps ?? 0,
        international_goals:  enriched.goals ?? 0,
        international_assists: 0,
        stats_per90:          {},
        recent_form:          [],
        tournament_history:   [],
        updated_at:           new Date().toISOString(),
      });
    }
  }

  // 4. Insert in batches of 100
  console.log(`\nInserting ${allRows.length} players into Supabase...`);
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await supabase.from("wc_players").insert(batch);
    if (error) console.error(`  Batch error (${i}–${i+batch.length-1}):`, error.message);
    else inserted += batch.length;
  }

  console.log(`\n✓ Done — ${inserted}/${allRows.length} players seeded`);

  // 5. Summary by country
  const { data: summary } = await supabase
    .from("wc_players")
    .select("country")
    .order("country");
  const counts: Record<string, number> = {};
  for (const r of summary ?? []) counts[r.country] = (counts[r.country] ?? 0) + 1;
  console.log("\nPlayers per country:");
  for (const [c, n] of Object.entries(counts).sort()) console.log(`  ${c.padEnd(25)} ${n}`);
}

main().catch(err => { console.error(err); process.exit(1); });
