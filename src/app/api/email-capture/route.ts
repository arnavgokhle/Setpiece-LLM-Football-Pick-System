import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, FROM_ADDRESS } from "@/lib/resend";
import { waitlistEmailHtml } from "@/lib/email-templates/waitlist";

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("email_waitlist")
      .insert({ email: email.toLowerCase().trim(), source: source ?? "website" });

    if (error) {
      if (error.code === "23505") {
        // Duplicate — already on list, don't send again
        return NextResponse.json({ ok: true });
      }
      throw error;
    }

    // Fresh signup — send waitlist welcome email
    getResend().emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "You're in — Setpiece Premier League picks are free",
      html: waitlistEmailHtml(),
    }).catch(err => console.error("[email-capture] resend error:", err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email-capture]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
