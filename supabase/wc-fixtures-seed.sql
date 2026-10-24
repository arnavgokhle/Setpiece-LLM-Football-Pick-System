-- ============================================================
-- SETPIECE — World Cup 2026 Fixtures Seed
-- Based on FIFA official draw (Dec 5, 2024) and published schedule
-- Kickoff times are in UTC. Approximate where not yet confirmed.
-- fixture_id 900001–900104 are temporary placeholder IDs
-- (real API-Football IDs will replace these once unlocked).
-- ============================================================

INSERT INTO wc_fixtures (
  fixture_id, match_date, kickoff_at,
  home_team, away_team,
  venue, city,
  stage, group_name, status
) VALUES

-- ================================================================
-- GROUP STAGE
-- ================================================================

-- ── GROUP A: Mexico · South Africa · South Korea · Czechia ──────

-- Matchday 1
(900001,'2026-06-11','2026-06-11T19:00:00Z','Mexico','South Africa','Estadio Azteca','Mexico City','Group A','A','NS'),
(900002,'2026-06-12','2026-06-12T02:00:00Z','South Korea','Czechia','Estadio Akron','Guadalajara','Group A','A','NS'),

-- Matchday 2
(900003,'2026-06-16','2026-06-16T22:00:00Z','Mexico','South Korea','Estadio Azteca','Mexico City','Group A','A','NS'),
(900004,'2026-06-16','2026-06-16T19:00:00Z','South Africa','Czechia','NRG Stadium','Houston','Group A','A','NS'),

-- Matchday 3 (simultaneous)
(900005,'2026-06-24','2026-06-24T21:00:00Z','Mexico','Czechia','Estadio Azteca','Mexico City','Group A','A','NS'),
(900006,'2026-06-24','2026-06-24T21:00:00Z','South Korea','South Africa','SoFi Stadium','Los Angeles','Group A','A','NS'),

-- ── GROUP B: Canada · Bosnia-Herzegovina · Qatar · Switzerland ───

-- Matchday 1
(900007,'2026-06-12','2026-06-12T19:00:00Z','Canada','Bosnia-Herzegovina','BMO Field','Toronto','Group B','B','NS'),
(900008,'2026-06-12','2026-06-12T22:00:00Z','Qatar','Switzerland','Levi''s Stadium','Santa Clara','Group B','B','NS'),

-- Matchday 2
(900009,'2026-06-17','2026-06-17T19:00:00Z','Canada','Qatar','BC Place','Vancouver','Group B','B','NS'),
(900010,'2026-06-17','2026-06-17T22:00:00Z','Bosnia-Herzegovina','Switzerland','Gillette Stadium','Boston','Group B','B','NS'),

-- Matchday 3 (simultaneous)
(900011,'2026-06-24','2026-06-24T17:00:00Z','Canada','Switzerland','BC Place','Vancouver','Group B','B','NS'),
(900012,'2026-06-24','2026-06-24T17:00:00Z','Bosnia-Herzegovina','Qatar','BMO Field','Toronto','Group B','B','NS'),

-- ── GROUP C: Brazil · Morocco · Haiti · Scotland ─────────────────

-- Matchday 1
(900013,'2026-06-13','2026-06-13T19:00:00Z','Brazil','Morocco','MetLife Stadium','East Rutherford','Group C','C','NS'),
(900014,'2026-06-13','2026-06-13T22:00:00Z','Haiti','Scotland','AT&T Stadium','Arlington','Group C','C','NS'),

-- Matchday 2
(900015,'2026-06-18','2026-06-18T19:00:00Z','Brazil','Haiti','NRG Stadium','Houston','Group C','C','NS'),
(900016,'2026-06-18','2026-06-18T22:00:00Z','Morocco','Scotland','Lincoln Financial Field','Philadelphia','Group C','C','NS'),

-- Matchday 3 (simultaneous)
(900017,'2026-06-24','2026-06-24T01:00:00Z','Brazil','Scotland','MetLife Stadium','East Rutherford','Group C','C','NS'),
(900018,'2026-06-24','2026-06-24T01:00:00Z','Morocco','Haiti','Hard Rock Stadium','Miami','Group C','C','NS'),

-- ── GROUP D: United States · Paraguay · Australia · Turkey ───────

-- Matchday 1
(900019,'2026-06-13','2026-06-13T01:00:00Z','United States','Paraguay','SoFi Stadium','Los Angeles','Group D','D','NS'),
(900020,'2026-06-13','2026-06-13T04:00:00Z','Australia','Turkey','BC Place','Vancouver','Group D','D','NS'),

-- Matchday 2
(900021,'2026-06-18','2026-06-18T01:00:00Z','United States','Australia','AT&T Stadium','Arlington','Group D','D','NS'),
(900022,'2026-06-18','2026-06-18T04:00:00Z','Paraguay','Turkey','Arrowhead Stadium','Kansas City','Group D','D','NS'),

-- Matchday 3 (simultaneous)
(900023,'2026-06-25','2026-06-25T21:00:00Z','United States','Turkey','AT&T Stadium','Arlington','Group D','D','NS'),
(900024,'2026-06-25','2026-06-25T21:00:00Z','Australia','Paraguay','Arrowhead Stadium','Kansas City','Group D','D','NS'),

-- ── GROUP E: Germany · Curaçao · Ivory Coast · Ecuador ──────────

-- Matchday 1
(900025,'2026-06-14','2026-06-14T19:00:00Z','Germany','Curaçao','Mercedes-Benz Stadium','Atlanta','Group E','E','NS'),
(900026,'2026-06-14','2026-06-14T22:00:00Z','Ivory Coast','Ecuador','Lumen Field','Seattle','Group E','E','NS'),

-- Matchday 2
(900027,'2026-06-19','2026-06-19T19:00:00Z','Germany','Ivory Coast','Hard Rock Stadium','Miami','Group E','E','NS'),
(900028,'2026-06-19','2026-06-19T22:00:00Z','Curaçao','Ecuador','Lincoln Financial Field','Philadelphia','Group E','E','NS'),

-- Matchday 3 (simultaneous)
(900029,'2026-06-25','2026-06-25T17:00:00Z','Germany','Ecuador','Mercedes-Benz Stadium','Atlanta','Group E','E','NS'),
(900030,'2026-06-25','2026-06-25T17:00:00Z','Ivory Coast','Curaçao','Gillette Stadium','Boston','Group E','E','NS'),

-- ── GROUP F: Netherlands · Japan · Sweden · Tunisia ─────────────

-- Matchday 1
(900031,'2026-06-15','2026-06-15T01:00:00Z','Netherlands','Japan','Gillette Stadium','Boston','Group F','F','NS'),
(900032,'2026-06-15','2026-06-15T04:00:00Z','Sweden','Tunisia','Hard Rock Stadium','Miami','Group F','F','NS'),

-- Matchday 2
(900033,'2026-06-20','2026-06-20T01:00:00Z','Netherlands','Sweden','MetLife Stadium','East Rutherford','Group F','F','NS'),
(900034,'2026-06-20','2026-06-20T04:00:00Z','Japan','Tunisia','Levi''s Stadium','Santa Clara','Group F','F','NS'),

-- Matchday 3 (simultaneous)
(900035,'2026-06-25','2026-06-25T01:00:00Z','Netherlands','Tunisia','MetLife Stadium','East Rutherford','Group F','F','NS'),
(900036,'2026-06-25','2026-06-25T01:00:00Z','Sweden','Japan','SoFi Stadium','Los Angeles','Group F','F','NS'),

-- ── GROUP G: Belgium · Egypt · Iran · New Zealand ───────────────

-- Matchday 1
(900037,'2026-06-15','2026-06-15T19:00:00Z','Belgium','Egypt','Lumen Field','Seattle','Group G','G','NS'),
(900038,'2026-06-15','2026-06-15T22:00:00Z','Iran','New Zealand','Lincoln Financial Field','Philadelphia','Group G','G','NS'),

-- Matchday 2
(900039,'2026-06-20','2026-06-20T19:00:00Z','Belgium','Iran','Arrowhead Stadium','Kansas City','Group G','G','NS'),
(900040,'2026-06-20','2026-06-20T22:00:00Z','Egypt','New Zealand','AT&T Stadium','Arlington','Group G','G','NS'),

-- Matchday 3 (simultaneous)
(900041,'2026-06-26','2026-06-26T21:00:00Z','Belgium','New Zealand','Lumen Field','Seattle','Group G','G','NS'),
(900042,'2026-06-26','2026-06-26T21:00:00Z','Egypt','Iran','NRG Stadium','Houston','Group G','G','NS'),

-- ── GROUP H: Spain · Cape Verde · Saudi Arabia · Uruguay ────────

-- Matchday 1
(900043,'2026-06-15','2026-06-15T22:00:00Z','Spain','Cape Verde','Mercedes-Benz Stadium','Atlanta','Group H','H','NS'),
(900044,'2026-06-16','2026-06-16T01:00:00Z','Saudi Arabia','Uruguay','Hard Rock Stadium','Miami','Group H','H','NS'),

-- Matchday 2
(900045,'2026-06-21','2026-06-21T01:00:00Z','Spain','Saudi Arabia','SoFi Stadium','Los Angeles','Group H','H','NS'),
(900046,'2026-06-21','2026-06-21T04:00:00Z','Cape Verde','Uruguay','Arrowhead Stadium','Kansas City','Group H','H','NS'),

-- Matchday 3 (simultaneous)
(900047,'2026-06-26','2026-06-26T17:00:00Z','Spain','Uruguay','MetLife Stadium','East Rutherford','Group H','H','NS'),
(900048,'2026-06-26','2026-06-26T17:00:00Z','Cape Verde','Saudi Arabia','Levi''s Stadium','Santa Clara','Group H','H','NS'),

-- ── GROUP I: France · Senegal · Iraq · Norway ───────────────────

-- Matchday 1
(900049,'2026-06-16','2026-06-16T19:00:00Z','France','Senegal','AT&T Stadium','Arlington','Group I','I','NS'),
(900050,'2026-06-16','2026-06-16T22:00:00Z','Iraq','Norway','Gillette Stadium','Boston','Group I','I','NS'),

-- Matchday 2
(900051,'2026-06-21','2026-06-21T19:00:00Z','France','Iraq','Mercedes-Benz Stadium','Atlanta','Group I','I','NS'),
(900052,'2026-06-21','2026-06-21T22:00:00Z','Senegal','Norway','Lincoln Financial Field','Philadelphia','Group I','I','NS'),

-- Matchday 3 (simultaneous)
(900053,'2026-06-27','2026-06-27T01:00:00Z','France','Norway','MetLife Stadium','East Rutherford','Group I','I','NS'),
(900054,'2026-06-27','2026-06-27T01:00:00Z','Senegal','Iraq','Hard Rock Stadium','Miami','Group I','I','NS'),

-- ── GROUP J: Argentina · Algeria · Austria · Jordan ─────────────

-- Matchday 1
(900055,'2026-06-17','2026-06-17T01:00:00Z','Argentina','Algeria','MetLife Stadium','East Rutherford','Group J','J','NS'),
(900056,'2026-06-17','2026-06-17T04:00:00Z','Austria','Jordan','NRG Stadium','Houston','Group J','J','NS'),

-- Matchday 2
(900057,'2026-06-22','2026-06-22T01:00:00Z','Argentina','Austria','Hard Rock Stadium','Miami','Group J','J','NS'),
(900058,'2026-06-22','2026-06-22T04:00:00Z','Algeria','Jordan','Lumen Field','Seattle','Group J','J','NS'),

-- Matchday 3 (simultaneous)
(900059,'2026-06-27','2026-06-27T21:00:00Z','Argentina','Jordan','MetLife Stadium','East Rutherford','Group J','J','NS'),
(900060,'2026-06-27','2026-06-27T21:00:00Z','Algeria','Austria','AT&T Stadium','Arlington','Group J','J','NS'),

-- ── GROUP K: Portugal · DR Congo · Uzbekistan · Colombia ────────

-- Matchday 1
(900061,'2026-06-17','2026-06-17T19:00:00Z','Portugal','DR Congo','Lincoln Financial Field','Philadelphia','Group K','K','NS'),
(900062,'2026-06-17','2026-06-17T22:00:00Z','Uzbekistan','Colombia','Arrowhead Stadium','Kansas City','Group K','K','NS'),

-- Matchday 2
(900063,'2026-06-22','2026-06-22T19:00:00Z','Portugal','Uzbekistan','SoFi Stadium','Los Angeles','Group K','K','NS'),
(900064,'2026-06-22','2026-06-22T22:00:00Z','DR Congo','Colombia','NRG Stadium','Houston','Group K','K','NS'),

-- Matchday 3 (simultaneous)
(900065,'2026-06-27','2026-06-27T17:00:00Z','Portugal','Colombia','MetLife Stadium','East Rutherford','Group K','K','NS'),
(900066,'2026-06-27','2026-06-27T17:00:00Z','DR Congo','Uzbekistan','Mercedes-Benz Stadium','Atlanta','Group K','K','NS'),

-- ── GROUP L: England · Croatia · Ghana · Panama ─────────────────

-- Matchday 1
(900067,'2026-06-18','2026-06-18T01:00:00Z','England','Croatia','Levi''s Stadium','Santa Clara','Group L','L','NS'),
(900068,'2026-06-18','2026-06-18T04:00:00Z','Ghana','Panama','Lumen Field','Seattle','Group L','L','NS'),

-- Matchday 2
(900069,'2026-06-23','2026-06-23T01:00:00Z','England','Ghana','AT&T Stadium','Arlington','Group L','L','NS'),
(900070,'2026-06-23','2026-06-23T04:00:00Z','Croatia','Panama','Gillette Stadium','Boston','Group L','L','NS'),

-- Matchday 3 (simultaneous)
(900071,'2026-06-28','2026-06-28T01:00:00Z','England','Panama','MetLife Stadium','East Rutherford','Group L','L','NS'),
(900072,'2026-06-28','2026-06-28T01:00:00Z','Croatia','Ghana','Hard Rock Stadium','Miami','Group L','L','NS'),

-- ================================================================
-- ROUND OF 32 (June 29 – July 3)
-- Teams TBD — bracket positions per FIFA draw
-- ================================================================

(900073,'2026-06-29','2026-06-29T19:00:00Z','TBD 1A','TBD 3DEF','MetLife Stadium','East Rutherford','R32',NULL,'NS'),
(900074,'2026-06-29','2026-06-29T23:00:00Z','TBD 1C','TBD 3ABC','Hard Rock Stadium','Miami','R32',NULL,'NS'),
(900075,'2026-06-30','2026-06-30T19:00:00Z','TBD 1B','TBD 2A','AT&T Stadium','Arlington','R32',NULL,'NS'),
(900076,'2026-06-30','2026-06-30T23:00:00Z','TBD 1D','TBD 2C','SoFi Stadium','Los Angeles','R32',NULL,'NS'),
(900077,'2026-07-01','2026-07-01T19:00:00Z','TBD 1E','TBD 3GHI','Mercedes-Benz Stadium','Atlanta','R32',NULL,'NS'),
(900078,'2026-07-01','2026-07-01T23:00:00Z','TBD 1G','TBD 3EFJ','Lumen Field','Seattle','R32',NULL,'NS'),
(900079,'2026-07-02','2026-07-02T19:00:00Z','TBD 1F','TBD 2E','Gillette Stadium','Boston','R32',NULL,'NS'),
(900080,'2026-07-02','2026-07-02T23:00:00Z','TBD 1H','TBD 2G','NRG Stadium','Houston','R32',NULL,'NS'),
(900081,'2026-07-02','2026-07-02T19:00:00Z','TBD 1I','TBD 3JKL','Lincoln Financial Field','Philadelphia','R32',NULL,'NS'),
(900082,'2026-07-02','2026-07-02T23:00:00Z','TBD 1K','TBD 3BCD','Arrowhead Stadium','Kansas City','R32',NULL,'NS'),
(900083,'2026-07-03','2026-07-03T19:00:00Z','TBD 1J','TBD 2I','Levi''s Stadium','Santa Clara','R32',NULL,'NS'),
(900084,'2026-07-03','2026-07-03T23:00:00Z','TBD 1L','TBD 2K','BC Place','Vancouver','R32',NULL,'NS'),
(900085,'2026-07-03','2026-07-03T19:00:00Z','TBD 2B','TBD 2D','BMO Field','Toronto','R32',NULL,'NS'),
(900086,'2026-07-03','2026-07-03T23:00:00Z','TBD 2F','TBD 2H','Estadio Azteca','Mexico City','R32',NULL,'NS'),
(900087,'2026-07-04','2026-07-04T19:00:00Z','TBD 2J','TBD 2L','Estadio BBVA','Monterrey','R32',NULL,'NS'),
(900088,'2026-07-04','2026-07-04T23:00:00Z','TBD 3AGH','TBD 3BEF','Estadio Akron','Guadalajara','R32',NULL,'NS'),

-- ================================================================
-- ROUND OF 16 (July 5–8)
-- ================================================================

(900089,'2026-07-05','2026-07-05T19:00:00Z','TBD R32W1','TBD R32W2','MetLife Stadium','East Rutherford','R16',NULL,'NS'),
(900090,'2026-07-05','2026-07-05T23:00:00Z','TBD R32W3','TBD R32W4','AT&T Stadium','Arlington','R16',NULL,'NS'),
(900091,'2026-07-06','2026-07-06T19:00:00Z','TBD R32W5','TBD R32W6','SoFi Stadium','Los Angeles','R16',NULL,'NS'),
(900092,'2026-07-06','2026-07-06T23:00:00Z','TBD R32W7','TBD R32W8','Mercedes-Benz Stadium','Atlanta','R16',NULL,'NS'),
(900093,'2026-07-07','2026-07-07T19:00:00Z','TBD R32W9','TBD R32W10','NRG Stadium','Houston','R16',NULL,'NS'),
(900094,'2026-07-07','2026-07-07T23:00:00Z','TBD R32W11','TBD R32W12','Hard Rock Stadium','Miami','R16',NULL,'NS'),
(900095,'2026-07-08','2026-07-08T19:00:00Z','TBD R32W13','TBD R32W14','Gillette Stadium','Boston','R16',NULL,'NS'),
(900096,'2026-07-08','2026-07-08T23:00:00Z','TBD R32W15','TBD R32W16','Arrowhead Stadium','Kansas City','R16',NULL,'NS'),

-- ================================================================
-- QUARTERFINALS (July 10–11)
-- ================================================================

(900097,'2026-07-10','2026-07-10T19:00:00Z','TBD R16W1','TBD R16W2','Gillette Stadium','Boston','QF',NULL,'NS'),
(900098,'2026-07-10','2026-07-10T23:00:00Z','TBD R16W3','TBD R16W4','SoFi Stadium','Los Angeles','QF',NULL,'NS'),
(900099,'2026-07-11','2026-07-11T19:00:00Z','TBD R16W5','TBD R16W6','Hard Rock Stadium','Miami','QF',NULL,'NS'),
(900100,'2026-07-11','2026-07-11T23:00:00Z','TBD R16W7','TBD R16W8','Arrowhead Stadium','Kansas City','QF',NULL,'NS'),

-- ================================================================
-- SEMIFINALS (July 14–15)
-- ================================================================

(900101,'2026-07-14','2026-07-14T23:00:00Z','TBD QFW1','TBD QFW2','AT&T Stadium','Arlington','SF',NULL,'NS'),
(900102,'2026-07-15','2026-07-15T23:00:00Z','TBD QFW3','TBD QFW4','Mercedes-Benz Stadium','Atlanta','SF',NULL,'NS'),

-- ================================================================
-- THIRD PLACE (July 18)
-- ================================================================

(900103,'2026-07-18','2026-07-18T21:00:00Z','TBD SFL1','TBD SFL2','Hard Rock Stadium','Miami','3rd',NULL,'NS'),

-- ================================================================
-- FINAL (July 19)
-- ================================================================

(900104,'2026-07-19','2026-07-19T19:00:00Z','TBD SFW1','TBD SFW2','MetLife Stadium','East Rutherford','Final',NULL,'NS')

ON CONFLICT (fixture_id) DO UPDATE SET
  home_team  = EXCLUDED.home_team,
  away_team  = EXCLUDED.away_team,
  kickoff_at = EXCLUDED.kickoff_at,
  match_date = EXCLUDED.match_date,
  venue      = EXCLUDED.venue,
  city       = EXCLUDED.city,
  stage      = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  updated_at = NOW();
