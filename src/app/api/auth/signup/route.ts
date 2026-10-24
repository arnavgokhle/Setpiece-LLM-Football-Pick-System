// Creates a new user pre-confirmed (no email verification step) and sends the welcome email immediately.
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, FROM_ADDRESS } from "@/lib/resend";
import { welcomeEmailHtml } from "@/lib/email-templates/welcome";

export async function POST(request: Request) {
  const { email, password, name } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, welcome_sent: true },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Welcome to Setpiece — here's how Scout works",
      html: welcomeEmailHtml(),
    });
  } catch (err) {
    console.error("[api/auth/signup] welcome email failed:", err);
  }

  return NextResponse.json({ userId: data.user?.id });
}
