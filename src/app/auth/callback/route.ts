// Handles Supabase email confirmation and OAuth callbacks
// Supabase redirects here after email verification with a code param

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getResend, FROM_ADDRESS } from "@/lib/resend";
import { welcomeEmailHtml } from "@/lib/email-templates/welcome";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = sessionData?.user;
      console.log("[auth/callback] user:", user?.email, "confirmed_at:", user?.email_confirmed_at, "welcome_sent:", user?.user_metadata?.welcome_sent);
      // welcome_sent flag is the only guard — email_confirmed_at can be null
      // in the PKCE session response even when confirmation just succeeded.
      if (user?.email && !user.user_metadata?.welcome_sent) {
        try {
          const { error: emailError } = await getResend().emails.send({
            from: FROM_ADDRESS,
            to: user.email,
            subject: "Welcome to Setpiece — Premier League picks start August 21",
            html: welcomeEmailHtml(),
          });
          if (emailError) {
            console.error("[auth/callback] welcome email error:", JSON.stringify(emailError));
          } else {
            console.log("[auth/callback] welcome email sent to:", user.email);
            await supabase.auth.updateUser({ data: { welcome_sent: true } });
          }
        } catch (err) {
          console.error("[auth/callback] welcome email exception:", err);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`);
}
