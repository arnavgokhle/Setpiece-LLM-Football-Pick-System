interface PickSummary {
  player: string;
  team: string;
  stat: string;
  line: number;
  direction: "MORE" | "LESS";
  confidence: number;
  match: string;
  reasoning?: string;
  formHit?: string;
}

interface NoPickMatch {
  homeTeam: string;
  awayTeam: string;
  reason: string;
}

interface MatchdayEmailOptions {
  picks: PickSummary[];
  powerPlay: PickSummary | null;
  matchLabel: string;
  noPickMatches?: NoPickMatch[];
}

function shortReasoning(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
  let out = sentences.slice(0, 2).join(" ").trim();
  if (out.length > 220) out = out.slice(0, 217) + "…";
  return out;
}

function pickBlockHtml(pick: PickSummary, featured = false): string {
  const isMore = pick.direction === "MORE";
  const dirColor = isMore ? "#00e87a" : "#f43f5e";
  const dirBg   = isMore ? "#00e87a1a" : "#f43f5e1a";
  const dirBorder = isMore ? "#00e87a33" : "#f43f5e33";
  const confColor = pick.confidence >= 80 ? "#00e87a" : pick.confidence >= 75 ? "#22c55e" : "#16a34a";
  const cardBg   = featured ? "#07120e" : "#0a0f1a";
  const borderLeft = featured ? "#00e87a" : "#161e30";
  const reasonText = pick.reasoning ? shortReasoning(pick.reasoning) : "";

  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
  <tr>
    <td bgcolor="${cardBg}" style="background-color:${cardBg};border-left:3px solid ${borderLeft};padding:14px 16px;border-radius:0 3px 3px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">

        ${featured ? `<tr><td bgcolor="${cardBg}" style="background-color:${cardBg};padding-bottom:8px;font-size:9px;font-family:monospace;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#00e87a;">TOP PICK</td></tr>` : ""}

        <!-- Player name row -->
        <tr>
          <td bgcolor="${cardBg}" style="background-color:${cardBg};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td bgcolor="${cardBg}" style="background-color:${cardBg};">
                <span style="font-size:15px;font-weight:700;color:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${pick.player}</span>
                <span style="font-size:11px;font-family:monospace;color:#38bdf8;margin-left:7px;">${pick.team}</span>
              </td>
              <td bgcolor="${cardBg}" style="background-color:${cardBg};text-align:right;vertical-align:top;white-space:nowrap;">
                <span style="font-size:11px;font-family:monospace;font-weight:700;color:${confColor};">${pick.confidence}%</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Match -->
        <tr><td bgcolor="${cardBg}" style="background-color:${cardBg};padding:2px 0 10px;font-size:10px;font-family:monospace;color:#2d3f5a;letter-spacing:0.04em;">${pick.match}</td></tr>

        <!-- Stat line -->
        <tr>
          <td bgcolor="${cardBg}" style="background-color:${cardBg};">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td bgcolor="${cardBg}" style="background-color:${cardBg};vertical-align:middle;">
                <span style="display:inline-block;padding:4px 12px;background:${dirBg};border:1px solid ${dirBorder};border-radius:2px;font-size:11px;font-family:monospace;font-weight:700;letter-spacing:0.08em;color:${dirColor};">${pick.direction}</span>
              </td>
              <td bgcolor="${cardBg}" style="background-color:${cardBg};padding-left:9px;vertical-align:middle;">
                <span style="font-size:${featured ? "30px" : "24px"};font-weight:900;color:#eef2ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:-0.02em;line-height:1;">${pick.line}</span>
              </td>
              <td bgcolor="${cardBg}" style="background-color:${cardBg};padding-left:7px;vertical-align:bottom;padding-bottom:3px;">
                <span style="font-size:10px;font-family:monospace;color:#3d5070;text-transform:uppercase;letter-spacing:0.07em;">${pick.stat}</span>
              </td>
            </tr></table>
          </td>
        </tr>

        ${pick.formHit ? `<tr><td bgcolor="${cardBg}" style="background-color:${cardBg};padding-top:5px;font-size:10px;font-family:monospace;color:#00e87a60;">${pick.formHit} last 5</td></tr>` : ""}

        ${reasonText ? `
        <tr><td bgcolor="${cardBg}" style="background-color:${cardBg};padding-top:10px;border-top:1px solid #131c2e;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td bgcolor="${cardBg}" style="background-color:${cardBg};padding-top:10px;font-size:12px;color:#4d6080;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${reasonText}</td>
          </tr></table>
        </td></tr>` : ""}

      </table>
    </td>
  </tr>
</table>`;
}

function pickBlockText(pick: PickSummary, featured = false): string {
  const label = `${pick.direction} ${pick.line} ${pick.stat}`;
  const lines = [
    featured ? "── TOP PICK ──" : "──",
    `${pick.player} (${pick.team}) · ${pick.match}`,
    `${label} · ${pick.confidence}%`,
    pick.formHit ? `Form: ${pick.formHit} last 5` : "",
    pick.reasoning ? shortReasoning(pick.reasoning) : "",
  ].filter(Boolean);
  return lines.join("\n") + "\n";
}

function noPickBlockHtml(match: NoPickMatch): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
  <tr>
    <td bgcolor="#070c14" style="background-color:#070c14;padding:10px 14px;border-left:3px solid #131c2e;border-radius:0 3px 3px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td bgcolor="#070c14" style="background-color:#070c14;font-size:12px;font-weight:600;color:#253040;padding-bottom:2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${match.homeTeam} vs ${match.awayTeam}</td></tr>
        <tr><td bgcolor="#070c14" style="background-color:#070c14;font-size:11px;color:#1a2535;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${match.reason}</td></tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function matchdayEmailHtml({ picks, powerPlay, matchLabel, noPickMatches }: MatchdayEmailOptions): string {
  const regularPicks = picks.slice(0, 2);
  const powerHtml = powerPlay ? pickBlockHtml(powerPlay, true) : "";
  const regularHtml = regularPicks.map(p => pickBlockHtml(p, false)).join("");
  const noPickHtml = noPickMatches?.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 8px;"><tr><td bgcolor="#000" style="background-color:#000;font-size:9px;font-family:monospace;letter-spacing:0.16em;text-transform:uppercase;color:#1e293b;padding-bottom:8px;">Passed on</td></tr></table>${noPickMatches.map(noPickBlockHtml).join("")}`
    : "";

  const totalPicks = regularPicks.length + (powerPlay ? 1 : 0);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="dark"/>
  <meta name="supported-color-schemes" content="dark"/>
  <title>Tonight's picks — ${matchLabel}</title>
  <style>:root{color-scheme:dark;}body,table,td{background-color:#000000!important;}</style>
</head>
<body bgcolor="#000000" style="margin:0;padding:0;background:#000000;background-color:#000000;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background-color:#000000;">
  <tr>
    <td bgcolor="#000000" align="center" style="background-color:#000000;padding:32px 16px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;">
        <tr>
          <td bgcolor="#000000" style="background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

            <!-- Header -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr><td bgcolor="#000000" style="background-color:#000000;">
                <span style="font-size:11px;font-family:monospace;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#00e87a;">Scout · Setpiece</span>
              </td></tr>
              <tr><td bgcolor="#000000" style="background-color:#000000;padding-top:8px;">
                <h1 style="margin:0;font-size:26px;font-weight:900;color:#eef2ff;letter-spacing:-0.02em;line-height:1.15;">Tonight's picks — ${matchLabel}.</h1>
              </td></tr>
              <tr><td bgcolor="#000000" style="background-color:#000000;padding-top:6px;">
                <span style="font-size:12px;color:#334155;font-family:monospace;">${totalPicks} pick${totalPicks !== 1 ? "s" : ""} · judge for yourself</span>
              </td></tr>
            </table>

            <!-- Picks -->
            ${powerHtml}
            ${regularHtml}
            ${noPickHtml}

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
              <tr><td bgcolor="#000000" style="background-color:#000000;">
                <a href="https://setpiecepicks.com/dashboard" style="display:inline-block;padding:11px 28px;background:#00e87a;color:#000000;font-size:12px;font-weight:800;text-decoration:none;border-radius:3px;letter-spacing:0.07em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Full analysis →</a>
              </td></tr>
            </table>

            <!-- Footer — minimal, no unsubscribe link to avoid promo trigger -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
              <tr><td bgcolor="#000000" style="background-color:#000000;">
                <p style="margin:0;font-size:10px;color:#0f1923;line-height:1.8;font-family:monospace;">
                  setpiecepicks.com · for entertainment only
                </p>
              </td></tr>
            </table>

          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function matchdayEmailText({ picks, powerPlay, matchLabel, noPickMatches }: MatchdayEmailOptions): string {
  const regularPicks = picks.slice(0, 2);
  const lines = [
    `Scout · Setpiece`,
    `Tonight's picks — ${matchLabel}`,
    ``,
    powerPlay ? pickBlockText(powerPlay, true) : "",
    ...regularPicks.map(p => pickBlockText(p, false)),
    noPickMatches?.length
      ? `Passed on:\n${noPickMatches.map(m => `- ${m.homeTeam} vs ${m.awayTeam}: ${m.reason}`).join("\n")}`
      : "",
    ``,
    `Full analysis: https://setpiecepicks.com/dashboard`,
    ``,
    `setpiecepicks.com · for entertainment only`,
  ].filter(s => s !== undefined);
  return lines.join("\n");
}
