import { NextRequest, NextResponse } from "next/server";
import { getResend, FROM_ADDRESS } from "@/lib/resend";
import { welcomeEmailHtml } from "@/lib/email-templates/welcome";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const { error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Welcome to Setpiece — Premier League picks start August 21",
      html: welcomeEmailHtml(),
    });

    if (error) {
      console.error("[email/welcome] Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email/welcome]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
