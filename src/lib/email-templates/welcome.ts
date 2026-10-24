export function welcomeEmailHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Setpiece</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <img src="https://setpiecepicks.com/LOGO.svg" alt="Setpiece" width="48" height="48"
                style="display:block;border:0;" />
              <p style="margin:10px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#4ade80;">
                SETPIECE
              </p>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background-color:#1a2332;border:1px solid rgba(74,222,128,0.18);border-radius:4px;overflow:hidden;">

              <!-- Green top bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:2px;background:linear-gradient(90deg,rgba(74,222,128,0) 0%,rgba(74,222,128,0.6) 50%,rgba(74,222,128,0) 100%);"></td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 36px 32px;">

                    <!-- Badge -->
                    <p style="margin:0 0 20px;display:inline-block;font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#4ade80;border:1px solid rgba(74,222,128,0.25);background-color:rgba(74,222,128,0.06);border-radius:100px;padding:5px 12px;">
                      Premier League 2026-27 · Free Access
                    </p>

                    <!-- Headline -->
                    <h1 style="margin:0 0 12px;font-size:34px;font-weight:900;line-height:1.05;letter-spacing:-0.03em;color:#f1f5f9;">
                      Scout is ready.<br />Are you?
                    </h1>

                    <!-- Subheadline -->
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#94a3b8;">
                      Setpiece turns real player stats into match picks — shots, passes, tackles, corners — for every Premier League match, plus Europe's biggest club fixtures. Scout is the AI analyst behind them: it reads each player's season form and the opponent's tendencies, then publishes a pick with the reasoning shown, not hidden.
                    </p>

                    <!-- Subheadline 2 -->
                    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#94a3b8;">
                      You now have free access to every pick for the opening month of the season — no card, no paywall.
                    </p>

                    <!-- Three points -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:28px;vertical-align:top;padding-top:2px;">
                                <span style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#4ade80;font-weight:700;">01</span>
                              </td>
                              <td>
                                <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;line-height:1.4;">Scout analyses real player stats</p>
                                <p style="margin:3px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#64748b;">Shots, passes, form data — for every match.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:28px;vertical-align:top;padding-top:2px;">
                                <span style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#4ade80;font-weight:700;">02</span>
                              </td>
                              <td>
                                <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;line-height:1.4;">Picks published before kickoff</p>
                                <p style="margin:3px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#64748b;">Full AI reasoning so you know exactly why.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0;">
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:28px;vertical-align:top;padding-top:2px;">
                                <span style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#4ade80;font-weight:700;">03</span>
                              </td>
                              <td>
                                <p style="margin:0;font-size:14px;font-weight:600;color:#f1f5f9;line-height:1.4;">Track your results live</p>
                                <p style="margin:3px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#64748b;">Full pick history, win rate, outcomes.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Tournament dates -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;background-color:rgba(74,222,128,0.04);border:1px solid rgba(74,222,128,0.12);border-radius:3px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#4ade80;">Free access window</p>
                          <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#f1f5f9;">August 21 – September 20, 2026</p>
                          <p style="margin:2px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#64748b;">Every match. Every pick. No restrictions.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:3px;background-color:#4ade80;">
                          <a href="https://setpiecepicks.com/dashboard"
                            style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0d1117;text-decoration:none;font-family:Inter,-apple-system,sans-serif;">
                            Go to Dashboard →
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-family:'Courier New',Courier,monospace;font-size:10px;color:#3a4a5a;">
                Questions? <a href="mailto:support@setpiecepicks.com" style="color:#64748b;text-decoration:none;">support@setpiecepicks.com</a>
              </p>
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#2a3a4a;line-height:1.6;">
                Setpiece · setpiecepicks.com<br />
                For entertainment purposes only. Not financial or betting advice.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
